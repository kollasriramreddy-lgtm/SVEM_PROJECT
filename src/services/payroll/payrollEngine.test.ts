import { describe, it, expect } from 'vitest';
import {
  getDaysInMonth,
  calculateDailyRate,
  calculateEmployeePayroll,
} from './payrollEngine';
import { Employee, Attendance } from '../../types';

describe('Siddi Vinayaka Earth Movers — Payroll Calculation Engine', () => {
  const baseEmployee: Employee = {
    id: 'emp-101',
    employee_code: 'SVEM-EMP-001',
    full_name: 'Ravi Kumar',
    designation: 'Lead Excavator Operator',
    worker_type: 'Excavator Operator',
    joining_date: '2024-01-01',
    monthly_salary: 30000,
    salary_effective_from: '2024-01-01',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  // 1. Daily Wage Calculation
  it('calculates accurate daily wage based on salary and days in month', () => {
    expect(calculateDailyRate(30000, 30)).toBe(1000);
    expect(calculateDailyRate(30000, 31)).toBeCloseTo(967.7419, 2);
    expect(calculateDailyRate(30000, 28)).toBeCloseTo(1071.4286, 2);
    expect(calculateDailyRate(30000, 29)).toBeCloseTo(1034.4828, 2);
  });

  // 2. Calendar Month Days (28, 29, 30, 31)
  it('returns exact days in month for leap and non-leap years', () => {
    expect(getDaysInMonth(2023, 2)).toBe(28); // 2023 Feb = 28 days
    expect(getDaysInMonth(2024, 2)).toBe(29); // 2024 Feb = 29 days (Leap Year)
    expect(getDaysInMonth(2026, 4)).toBe(30); // April = 30 days
    expect(getDaysInMonth(2026, 8)).toBe(31); // August = 31 days
  });

  // Helper to generate full month attendance
  function generateFullMonthAttendance(
    year: number,
    month: number,
    statusModifier?: (dateStr: string, dayOfWeek: number) => 'Present' | 'Absent' | 'Sunday Duty' | 'Leave' | 'Half Day'
  ): Attendance[] {
    const days = getDaysInMonth(year, month);
    const list: Attendance[] = [];

    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      let status: 'Present' | 'Absent' | 'Sunday Duty' | 'Leave' | 'Half Day' = 'Present';
      if (dayOfWeek === 0) {
        status = 'Sunday Duty'; // Worked Sunday by default unless modified
      }

      if (statusModifier) {
        status = statusModifier(dateStr, dayOfWeek);
      }

      list.push({
        id: `att-${d}`,
        employee_id: baseEmployee.id,
        site_id: 'site-1',
        attendance_date: dateStr,
        status,
        marked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return list;
  }

  // 6. First Two Sundays (Included in base salary, 0 overtime)
  it('treats first 2 worked Sundays as included in base monthly salary with zero OT', () => {
    let sundaysCount = 0;
    const attendances = generateFullMonthAttendance(2026, 6, (_date, dayOfWeek) => {
      if (dayOfWeek === 0) {
        sundaysCount++;
        return sundaysCount <= 2 ? 'Sunday Duty' : 'Leave'; // only 2 worked sundays
      }
      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: baseEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.days_in_month).toBe(30);
    expect(result.daily_rate).toBe(1000);
    expect(result.calculation_metadata.sundaysWorkedCount).toBe(2);
    expect(result.calculation_metadata.includedSundaysCount).toBe(2);
    expect(result.calculation_metadata.overtimeSundaysCount).toBe(0);
    expect(result.sunday_overtime_pay).toBe(0);
    expect(result.gross_pay).toBe(30000);
    expect(result.net_pay).toBe(30000);
  });

  // 7. Third Sunday Overtime (2x daily wage)
  it('pays 2x daily wage overtime for 3rd worked Sunday', () => {
    let sundaysCount = 0;
    const attendances = generateFullMonthAttendance(2026, 6, (_date, dayOfWeek) => {
      if (dayOfWeek === 0) {
        sundaysCount++;
        return sundaysCount <= 3 ? 'Sunday Duty' : 'Leave';
      }
      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: baseEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.calculation_metadata.sundaysWorkedCount).toBe(3);
    expect(result.calculation_metadata.overtimeSundaysCount).toBe(1);
    expect(result.sunday_overtime_pay).toBe(2000); // 1 extra Sunday * 2 * 1000 = 2000
    expect(result.gross_pay).toBe(32000);
    expect(result.net_pay).toBe(32000);
  });

  // 8. Multiple Overtime Sundays (4 Sundays worked -> 4x daily wage overtime)
  it('pays 4x daily wage overtime for 4 worked Sundays (2 extra Sundays * 2x rate)', () => {
    let sundaysCount = 0;
    const attendances = generateFullMonthAttendance(2026, 6, (_date, dayOfWeek) => {
      if (dayOfWeek === 0) {
        sundaysCount++;
        return sundaysCount <= 4 ? 'Sunday Duty' : 'Leave';
      }
      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: baseEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.calculation_metadata.sundaysWorkedCount).toBe(4);
    expect(result.calculation_metadata.overtimeSundaysCount).toBe(2);
    expect(result.sunday_overtime_pay).toBe(4000); // 2 * (2 * 1000) = 4000
    expect(result.net_pay).toBe(34000);
  });

  // 9. Rule A: Saturday Absent + Sunday Not Worked -> Deduct Sunday wage (1x daily wage) + Sat Absent
  it('applies Rule A: Saturday Absent + Sunday Not Worked -> Sunday deduction of 1x daily rate', () => {
    const attendances = generateFullMonthAttendance(2026, 6, (dateStr, dayOfWeek) => {
      if (dateStr === '2026-06-06') return 'Absent'; // Sat Absent
      if (dateStr === '2026-06-07') return 'Absent'; // Sun Not Worked
      if (dayOfWeek === 0) return 'Sunday Duty';
      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: baseEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.calculation_metadata.ruleA_SaturdayAbsentSundays).toContain('2026-06-07');
    // Sat absent (1000) + Sun absent penalty (1000) = 2000 total deduction
    expect(result.absence_deductions).toBe(2000);
    expect(result.sandwich_deductions).toBe(0);
  });

  // 10. Rule B: Saturday Absent + Sunday Worked -> Sunday receives standard single-day pay (no OT multiplier)
  it('applies Rule B: Saturday Absent + Sunday Worked -> Sunday treated as standard single-day pay', () => {
    const attendances = generateFullMonthAttendance(2026, 6, (dateStr) => {
      if (dateStr === '2026-06-06') return 'Absent'; // Sat Absent
      if (dateStr === '2026-06-07') return 'Sunday Duty'; // Sun Worked
      if (dateStr === '2026-06-08') return 'Present'; // Mon Present
      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: baseEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.calculation_metadata.ruleB_SaturdayAbsentSundayWorked).toContain('2026-06-07');
    // Saturday absent = 1000 deduction
    expect(result.absence_deductions).toBe(1000);
    expect(result.sandwich_deductions).toBe(0);
  });

  // 11. Rule C: Sunday Worked + Monday Absent -> Sunday wage is forfeited (deduct 1x daily rate)
  it('applies Rule C: Sunday Worked + Monday Absent -> Sunday wage forfeited (deduct 1x daily wage)', () => {
    const attendances = generateFullMonthAttendance(2026, 6, (dateStr) => {
      if (dateStr === '2026-06-06') return 'Present'; // Sat Present
      if (dateStr === '2026-06-07') return 'Sunday Duty'; // Sun Worked
      if (dateStr === '2026-06-08') return 'Absent'; // Mon Absent
      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: baseEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.calculation_metadata.ruleC_SundayWorkedMondayAbsent).toContain('2026-06-07');
    // Mon absent (1000) + Sunday forfeited (1000) = 2000 total deduction
    expect(result.absence_deductions).toBe(2000);
    expect(result.sandwich_deductions).toBe(0);
  });

  // 12. Rule D: Full Sandwich Cut (Matches Section 12 Master Prompt specification exactly)
  it('applies Rule D: Full Sandwich Cut (Sat Absent + Sun Worked + Mon Absent) -> Deduct 3x daily wage as SANDWICH_DEDUCTION', () => {
    const attendances = generateFullMonthAttendance(2026, 6, (dateStr, dayOfWeek) => {
      if (dateStr === '2026-06-06') return 'Absent';
      if (dateStr === '2026-06-07') return 'Sunday Duty'; // Worked Sunday 1
      if (dateStr === '2026-06-08') return 'Absent';
      if (dateStr === '2026-06-14') return 'Sunday Duty'; // Worked Sunday 2
      if (dayOfWeek === 0) return 'Leave'; // other Sundays off

      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: baseEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.calculation_metadata.sundaysWorkedCount).toBe(2);
    expect(result.sunday_overtime_pay).toBe(0);
    expect(result.calculation_metadata.ruleD_FullSandwichCuts.length).toBe(1);
    expect(result.calculation_metadata.ruleD_FullSandwichCuts[0].deduction).toBe(3000);
    expect(result.sandwich_deductions).toBe(3000);
    expect(result.absence_deductions).toBe(0); // Encapsulated cleanly in sandwich deduction
    // Base 30,000 - 3,000 sandwich cut = 27,000 Net Pay
    expect(result.net_pay).toBe(27000);
  });

  // 13. Mid-Month Joining Proration
  it('prorates salary accurately when employee joins mid-month', () => {
    const midMonthEmployee: Employee = {
      ...baseEmployee,
      joining_date: '2026-06-16', // joined on 16th of 30-day month -> 15 active days (June 16 to June 30)
    };

    let sundaysCount = 0;
    const attendances = generateFullMonthAttendance(2026, 6, (_date, dayOfWeek) => {
      if (dayOfWeek === 0) {
        sundaysCount++;
        return sundaysCount <= 2 ? 'Sunday Duty' : 'Leave';
      }
      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: midMonthEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.calculation_metadata.activeDaysInMonth).toBe(15);
    expect(result.base_pay).toBe(15000); // 15 days * 1000 = 15000
    expect(result.net_pay).toBe(15000);
  });

  // 14. Mid-Month Exit Proration
  it('prorates salary accurately when employee leaves mid-month', () => {
    const leavingEmployee: Employee = {
      ...baseEmployee,
      leaving_date: '2026-06-10', // left on 10th -> 10 active days
    };

    const attendances = generateFullMonthAttendance(2026, 6);

    const result = calculateEmployeePayroll({
      employee: leavingEmployee,
      year: 2026,
      month: 6,
      attendances,
    });

    expect(result.calculation_metadata.activeDaysInMonth).toBe(10);
    expect(result.base_pay).toBe(10000);
  });

  // 15. Adjustments (Bonus, Advance, Correction)
  it('applies manual adjustments accurately into net pay', () => {
    let sundaysCount = 0;
    const attendances = generateFullMonthAttendance(2026, 6, (_date, dayOfWeek) => {
      if (dayOfWeek === 0) {
        sundaysCount++;
        return sundaysCount <= 2 ? 'Sunday Duty' : 'Leave';
      }
      return 'Present';
    });

    const result = calculateEmployeePayroll({
      employee: baseEmployee,
      year: 2026,
      month: 6,
      attendances,
      adjustments: [
        {
          id: 'adj-1',
          payroll_record_id: 'rec-1',
          type: 'Bonus',
          amount: 2500,
          reason: 'Site Milestone Performance Bonus',
          created_at: new Date().toISOString(),
        },
        {
          id: 'adj-2',
          payroll_record_id: 'rec-1',
          type: 'Advance',
          amount: -1000,
          reason: 'Mid-month cash advance deduction',
          created_at: new Date().toISOString(),
        },
      ],
    });

    expect(result.adjustments).toBe(1500); // 2500 - 1000 = 1500
    // Net Pay = 30000 (gross) + 1500 (adjustments) = 31500
    expect(result.net_pay).toBe(31500);
  });
});
