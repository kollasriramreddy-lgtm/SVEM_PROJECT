import {
  Employee,
  Attendance,
  PayrollRecord,
  PayrollRuleSettings,
  CalculationMetadata,
  CalculationStepExplanation,
  PayrollAdjustment,
} from '../../types';

export const DEFAULT_PAYROLL_RULES: PayrollRuleSettings = {
  mandatory_sundays: 2,
  sunday_overtime_multiplier: 2.0,
  enable_sandwich_rule: true,
  enable_saturday_absent_rule: true,
  enable_monday_absent_rule: true,
  half_day_factor: 0.5,
};

/**
 * Returns total days in a given calendar month (e.g. 28, 29, 30, 31).
 * Note: month is 1-indexed (1 = Jan, 12 = Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Helper to parse YYYY-MM-DD cleanly without timezone bias
 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number);
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2],
  };
}

/**
 * Helper to format date string as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Calculate Daily Wage Rate: S / D
 */
export function calculateDailyRate(monthlySalary: number, daysInMonth: number): number {
  if (daysInMonth <= 0) return 0;
  return Number((monthlySalary / daysInMonth).toFixed(4));
}

/**
 * Format Indian Rupee currency string
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface EmployeePayrollInput {
  employee: Employee;
  year: number;
  month: number; // 1-12
  attendances: Attendance[]; // Full attendance list for the employee in (and adjacent to) this month
  adjustments?: PayrollAdjustment[];
  rules?: Partial<PayrollRuleSettings>;
}

/**
 * Core Deterministic Payroll Calculation Service for Siddi Vinayaka Earth Movers
 */
export function calculateEmployeePayroll(input: EmployeePayrollInput): PayrollRecord {
  const { employee, year, month, attendances, adjustments = [], rules: customRules } = input;
  const rules: PayrollRuleSettings = { ...DEFAULT_PAYROLL_RULES, ...customRules };

  const daysInMonth = getDaysInMonth(year, month);
  const monthlySalary = employee.monthly_salary || 0;
  const dailyRate = calculateDailyRate(monthlySalary, daysInMonth);

  // Map of attendance by date "YYYY-MM-DD"
  const attendanceMap = new Map<string, Attendance>();
  attendances.forEach((att) => {
    attendanceMap.set(att.attendance_date, att);
  });

  const monthStartStr = createDateString(year, month, 1);
  const monthEndStr = createDateString(year, month, daysInMonth);

  const joiningDateStr = employee.joining_date || monthStartStr;
  const leavingDateStr = employee.leaving_date || monthEndStr;

  // Active days in month count
  let activeDaysCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const curDateStr = createDateString(year, month, d);
    if (curDateStr >= joiningDateStr && curDateStr <= leavingDateStr) {
      activeDaysCount++;
    }
  }

  // Base Pay: If employee joined mid-month or left mid-month, prorate base pay
  const isProrated = activeDaysCount < daysInMonth;
  const basePay = isProrated
    ? Number((dailyRate * activeDaysCount).toFixed(2))
    : monthlySalary;

  // Track counts & rule triggers
  let presentDaysCount = 0;
  let halfDaysCount = 0;
  let weekdayAbsentDaysCount = 0;
  let leaveDaysCount = 0;
  let holidayDaysCount = 0;
  let sundaysWorkedCount = 0;

  const ruleA_SaturdayAbsentSundays: string[] = [];
  const ruleB_SaturdayAbsentSundayWorked: string[] = [];
  const ruleC_SundayWorkedMondayAbsent: string[] = [];
  const ruleD_FullSandwichCuts: {
    saturday: string;
    sunday: string;
    monday: string;
    deduction: number;
  }[] = [];

  // 1. Process all days in the month
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month - 1, d);
    const dateStr = createDateString(year, month, d);

    // Skip if before joining or after leaving
    if (dateStr < joiningDateStr || dateStr > leavingDateStr) {
      continue;
    }

    const att = attendanceMap.get(dateStr);
    const dayOfWeek = curDate.getDay(); // 0 = Sunday, 6 = Saturday

    if (dayOfWeek === 0) {
      // Sunday
      if (att && (att.status === 'Sunday Duty' || att.status === 'Present')) {
        sundaysWorkedCount++;
      }
      // Sunday absence deductions are evaluated explicitly in the Sunday & Sandwich engine
      continue;
    }

    // Normal Weekday (Monday to Saturday)
    if (!att) {
      weekdayAbsentDaysCount++;
      continue;
    }

    switch (att.status) {
      case 'Present':
        presentDaysCount++;
        break;
      case 'Half Day':
        halfDaysCount++;
        break;
      case 'Absent':
        weekdayAbsentDaysCount++;
        break;
      case 'Leave':
        leaveDaysCount++;
        break;
      case 'Holiday':
        holidayDaysCount++;
        break;
      default:
        presentDaysCount++;
    }
  }

  // ==========================================================================
  // SUNDAY OVERTIME CALCULATION
  // Monthly salary includes 2 mandatory Sundays.
  // Overtime starts from 3rd worked Sunday at multiplier × dailyRate.
  // ==========================================================================
  const mandatorySundays = rules.mandatory_sundays;
  const includedSundaysCount = Math.min(sundaysWorkedCount, mandatorySundays);
  const overtimeSundaysCount = Math.max(0, sundaysWorkedCount - mandatorySundays);
  const sundayOvertimePay = Number(
    (overtimeSundaysCount * (rules.sunday_overtime_multiplier * dailyRate)).toFixed(2)
  );

  // ==========================================================================
  // SUNDAY ABSENCE / SANDWICH RULES (RULES A, B, C, D)
  // ==========================================================================
  let sandwichDeductionsTotal = 0;
  let sundayAbsenceDeductionsTotal = 0;
  const sandwichSaturdays = new Set<string>();
  const sandwichMondays = new Set<string>();

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month - 1, d);
    const dayOfWeek = curDate.getDay();

    if (dayOfWeek === 0) {
      // Sunday found
      const sunDateStr = createDateString(year, month, d);

      // Saturday (d - 1)
      const satDate = new Date(year, month - 1, d - 1);
      const satDateStr = formatDateISO(satDate);

      // Monday (d + 1)
      const monDate = new Date(year, month - 1, d + 1);
      const monDateStr = formatDateISO(monDate);

      const satAtt = attendanceMap.get(satDateStr);
      const sunAtt = attendanceMap.get(sunDateStr);
      const monAtt = attendanceMap.get(monDateStr);

      const isSatAbsent = satAtt?.status === 'Absent';
      const isSunWorked = sunAtt?.status === 'Sunday Duty' || sunAtt?.status === 'Present';
      const isMonAbsent = monAtt?.status === 'Absent';

      // RULE D — FULL SANDWICH CUT
      // Saturday = Absent + Sunday = Worked + Monday = Absent
      // Deduct 3 × daily wage (Saturday + Sunday + Monday)
      if (
        rules.enable_sandwich_rule &&
        isSatAbsent &&
        isSunWorked &&
        isMonAbsent
      ) {
        const deduction = Number((3 * dailyRate).toFixed(2));
        ruleD_FullSandwichCuts.push({
          saturday: satDateStr,
          sunday: sunDateStr,
          monday: monDateStr,
          deduction,
        });
        sandwichDeductionsTotal += deduction;
        sandwichSaturdays.add(satDateStr);
        sandwichMondays.add(monDateStr);
        continue;
      }

      // RULE C — SUNDAY WORKED + MONDAY ABSENT
      // Sunday = Worked, Monday = Absent
      // Sunday wage forfeited: deduct 1 × daily wage
      if (
        rules.enable_monday_absent_rule &&
        isSunWorked &&
        isMonAbsent &&
        !isSatAbsent
      ) {
        ruleC_SundayWorkedMondayAbsent.push(sunDateStr);
        sundayAbsenceDeductionsTotal += Number((1 * dailyRate).toFixed(2));
      }

      // RULE B — SATURDAY ABSENT + SUNDAY WORKED
      // Saturday = Absent, Sunday = Worked (and Monday not absent)
      // Sunday receives standard single-day pay (no OT multiplier)
      if (
        rules.enable_saturday_absent_rule &&
        isSatAbsent &&
        isSunWorked &&
        !isMonAbsent
      ) {
        ruleB_SaturdayAbsentSundayWorked.push(sunDateStr);
      }

      // RULE A — SATURDAY ABSENT + SUNDAY NOT WORKED
      // Saturday = Absent, Sunday = Not Worked
      // Deduct Sunday wage: 1 × daily wage
      if (
        rules.enable_saturday_absent_rule &&
        isSatAbsent &&
        !isSunWorked
      ) {
        ruleA_SaturdayAbsentSundays.push(sunDateStr);
        sundayAbsenceDeductionsTotal += Number((1 * dailyRate).toFixed(2));
      }
    }
  }

  // ==========================================================================
  // STANDARD ABSENCE & LEAVE DEDUCTIONS
  // ==========================================================================
  // Deduct standard weekday absences that are not already encapsulated inside Rule D sandwich cuts
  let standardAbsentDaysToDeduct = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month - 1, d);
    const dateStr = createDateString(year, month, d);

    if (dateStr < joiningDateStr || dateStr > leavingDateStr) continue;
    if (curDate.getDay() === 0) continue; // Sunday handled above

    const att = attendanceMap.get(dateStr);
    const isAbsent = !att || att.status === 'Absent';

    if (isAbsent) {
      if (sandwichSaturdays.has(dateStr) || sandwichMondays.has(dateStr)) {
        // Handled inside Rule D 3-day cut
        continue;
      }
      standardAbsentDaysToDeduct++;
    }
  }

  const regularAbsenceDeductions = Number((standardAbsentDaysToDeduct * dailyRate).toFixed(2));
  const halfDayDeductions = Number((halfDaysCount * (rules.half_day_factor * dailyRate)).toFixed(2));
  const leaveDeductions = Number((leaveDaysCount * dailyRate).toFixed(2));

  const totalAbsenceDeductions = Number(
    (regularAbsenceDeductions + halfDayDeductions + leaveDeductions + sundayAbsenceDeductionsTotal).toFixed(2)
  );

  // ==========================================================================
  // ADJUSTMENTS (BONUSES, ADVANCES, DEDUCTIONS, CORRECTIONS)
  // ==========================================================================
  let totalAdjustments = 0;
  const adjustmentsList = adjustments.map((adj) => {
    totalAdjustments += adj.amount;
    return {
      type: adj.type,
      amount: adj.amount,
      reason: adj.reason,
    };
  });

  // ==========================================================================
  // TOTALS & NET PAY
  // ==========================================================================
  const grossPay = Number((basePay + sundayOvertimePay).toFixed(2));
  const totalDeductions = Number(
    (totalAbsenceDeductions + sandwichDeductionsTotal).toFixed(2)
  );
  const netPay = Math.max(
    0,
    Number((grossPay - totalDeductions + totalAdjustments).toFixed(2))
  );

  // ==========================================================================
  // EXPLAINABLE STEP-BY-STEP CALCULATION SNAPSHOT
  // ==========================================================================
  const explanationSteps: CalculationStepExplanation[] = [
    {
      step: '1. Daily Rate Calculation',
      formula: 'Monthly Salary (S) / Calendar Days in Month (D)',
      values: `${formatINR(monthlySalary)} / ${daysInMonth} days`,
      result: `${formatINR(dailyRate)} / day`,
      notes: `Based on actual ${daysInMonth} calendar days in ${month}/${year}.`,
    },
    {
      step: '2. Base Salary Calculation',
      formula: isProrated
        ? 'Daily Rate × Active Employment Days'
        : 'Full Monthly Base Salary',
      values: isProrated
        ? `${formatINR(dailyRate)} × ${activeDaysCount} active days`
        : formatINR(monthlySalary),
      result: formatINR(basePay),
      notes: isProrated
        ? `Prorated for joining/exit date within month.`
        : `Full standard month salary.`,
    },
    {
      step: '3. Sunday Overtime',
      formula: 'Max(0, Sundays Worked - 2 Included) × 2.0 × Daily Rate',
      values: `Max(0, ${sundaysWorkedCount} - 2) × 2.0 × ${formatINR(dailyRate)} = ${overtimeSundaysCount} OT Sundays × ${formatINR(2 * dailyRate)}`,
      result: `+ ${formatINR(sundayOvertimePay)}`,
      notes: `First 2 Sundays included in base salary; ${overtimeSundaysCount} extra Sunday(s) paid at double daily rate.`,
    },
    {
      step: '4. Standard Absence & Leave Deductions',
      formula: '(Unexcused Absent Days + Unpaid Leaves + 0.5 × Half Days + Sunday Absence Penalties) × Daily Rate',
      values: `(${standardAbsentDaysToDeduct} absent + ${leaveDaysCount} leave + 0.5×${halfDaysCount} half-day + ${Number((sundayAbsenceDeductionsTotal / (dailyRate || 1)).toFixed(0))} Sun penalty) × ${formatINR(dailyRate)}`,
      result: `- ${formatINR(totalAbsenceDeductions)}`,
      notes: `Includes Rule A (Saturday absent -> Sunday wage deduction) and Rule C (Sunday worked + Monday absent -> Sunday forfeit).`,
    },
  ];

  if (sandwichDeductionsTotal > 0) {
    explanationSteps.push({
      step: '5. Rule D — Full Sandwich Deduction',
      formula: 'Count of (Sat Absent + Sun Worked + Mon Absent) × 3 × Daily Rate',
      values: `${ruleD_FullSandwichCuts.length} sandwich cut(s) × 3 × ${formatINR(dailyRate)}`,
      result: `- ${formatINR(sandwichDeductionsTotal)}`,
      notes: `Rule D penalty for Saturday Absent + Sunday Worked + Monday Absent.`,
    });
  }

  if (adjustments.length > 0) {
    explanationSteps.push({
      step: '6. Manual Adjustments',
      formula: 'Sum of all approved bonuses, advances, corrections, and deductions',
      values: adjustments.map((a) => `${a.type} (${a.reason}): ${a.amount >= 0 ? '+' : ''}${formatINR(a.amount)}`).join(', '),
      result: `${totalAdjustments >= 0 ? '+' : ''}${formatINR(totalAdjustments)}`,
      notes: 'Administrative adjustments with documented reasons.',
    });
  }

  explanationSteps.push({
    step: '7. Final Net Salary',
    formula: 'Gross Pay (Base + Sunday OT) - Total Deductions + Adjustments',
    values: `${formatINR(grossPay)} - ${formatINR(totalDeductions)} + ${formatINR(totalAdjustments)}`,
    result: formatINR(netPay),
    notes: 'Total final payout to employee for the month.',
  });

  const calculation_metadata: CalculationMetadata = {
    calendarDays: daysInMonth,
    dailyRate,
    activeDaysInMonth: activeDaysCount,
    presentDaysCount,
    halfDaysCount,
    absentDaysCount: standardAbsentDaysToDeduct + (ruleD_FullSandwichCuts.length * 2),
    leaveDaysCount,
    holidayDaysCount,
    sundaysWorkedCount,
    includedSundaysCount,
    overtimeSundaysCount,
    sundayOvertimeMultiplier: rules.sunday_overtime_multiplier,
    sundayOvertimePay,
    ruleA_SaturdayAbsentSundays,
    ruleB_SaturdayAbsentSundayWorked,
    ruleC_SundayWorkedMondayAbsent,
    ruleD_FullSandwichCuts,
    standardAbsenceDeductions: totalAbsenceDeductions,
    sandwichDeductionsTotal,
    adjustmentsList,
    explanationSteps,
  };

  return {
    id: `payrec-${employee.id}-${year}-${month}`,
    payroll_period_id: `period-${year}-${month}`,
    employee_id: employee.id,
    monthly_salary: monthlySalary,
    days_in_month: daysInMonth,
    daily_rate: dailyRate,
    base_pay: basePay,
    sunday_base_pay: 0,
    sunday_overtime_pay: sundayOvertimePay,
    absence_deductions: totalAbsenceDeductions,
    sandwich_deductions: sandwichDeductionsTotal,
    other_deductions: 0,
    adjustments: totalAdjustments,
    gross_pay: grossPay,
    net_pay: netPay,
    calculation_metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee_name: employee.full_name,
    employee_code: employee.employee_code,
    designation: employee.designation,
    worker_type: employee.worker_type,
    site_id: employee.site_id,
    site_name: employee.site_name,
  };
}
