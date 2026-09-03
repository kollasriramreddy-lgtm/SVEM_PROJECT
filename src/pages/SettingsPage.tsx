import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Calculator,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { CompanySettings, PayrollRuleSettings } from '../types';
import { db } from '../services/db/database';

export const SettingsPage: React.FC = () => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [payrollRules, setPayrollRules] = useState<PayrollRuleSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [c, p] = await Promise.all([db.getCompanySettings(), db.getPayrollRules()]);
    setCompanySettings(c);
    setPayrollRules(p);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySettings) return;

    setIsSaving(true);
    try {
      await db.saveCompanySettings(companySettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollRules) return;

    setIsSaving(true);
    try {
      await db.savePayrollRules(payrollRules);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all data to default Hyderabad operations seed data?')) {
      await db.resetDemoData();
      window.location.reload();
    }
  };

  if (!companySettings || !payrollRules) {
    return <div className="p-8 text-center text-slate-500">Loading company settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Settings className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              ENTERPRISE & SYSTEM CONFIGURATION
            </h2>
            <p className="text-xs text-slate-500">
              Corporate profile, default Sunday overtime rules, sandwich penalty parameters & database maintenance
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-300 animate-pulse">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Settings Updated
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Company Profile Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Company Identity & Tax Details
            </h3>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Company Name</label>
              <input
                type="text"
                value={companySettings.company_name}
                onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Tagline / Business Scope</label>
              <input
                type="text"
                value={companySettings.tagline}
                onChange={(e) => setCompanySettings({ ...companySettings, tagline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Registered Address</label>
              <textarea
                rows={2}
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={companySettings.gstin}
                  onChange={(e) => setCompanySettings({ ...companySettings, gstin: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Currency</label>
                <input
                  type="text"
                  value="INR (₹) - Indian Rupee"
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Timezone</label>
                <input
                  type="text"
                  value="Asia/Kolkata (IST)"
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
              >
                <Save className="h-3.5 w-3.5 text-amber-400" />
                Save Company Profile
              </button>
            </div>
          </form>
        </div>

        {/* 2. Payroll Rules Configuration Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Payroll Engine Rule Parameters
            </h3>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-4 text-xs">
            <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-amber-900">
              <p className="font-bold flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-amber-600" />
                Strict Contractor Payroll Specifications
              </p>
              <p className="text-[11px] mt-1 leading-relaxed text-amber-800">
                The engine uses actual calendar month days (28/29/30/31). Daily rate = S / D. Mandatory 2 Sundays are included in base monthly pay; extra worked Sundays receive overtime multiplier.
              </p>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">
                Mandatory Included Sundays in Base Monthly Salary
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={payrollRules.mandatory_sundays}
                onChange={(e) => setPayrollRules({ ...payrollRules, mandatory_sundays: parseInt(e.target.value) || 2 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900"
                required
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Standard contractor policy: 2 Sundays</p>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">
                Extra Sunday Overtime Multiplier
              </label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="3.0"
                value={payrollRules.sunday_overtime_multiplier}
                onChange={(e) => setPayrollRules({ ...payrollRules, sunday_overtime_multiplier: parseFloat(e.target.value) || 2.0 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900"
                required
              />
              <p className="text-[10px] text-slate-400 mt-0.5">2.0× Daily Wage Rate for 3rd Sunday onward</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payrollRules.enable_sandwich_rule}
                  onChange={(e) => setPayrollRules({ ...payrollRules, enable_sandwich_rule: e.target.checked })}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-800">
                  Enable Rule D (Full Sandwich Cut: Sat Absent + Sun Worked + Mon Absent = 3x Daily Cut)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payrollRules.enable_saturday_absent_rule}
                  onChange={(e) => setPayrollRules({ ...payrollRules, enable_saturday_absent_rule: e.target.checked })}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-800">
                  Enable Rule A & B (Saturday Absent Penalties)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payrollRules.enable_monday_absent_rule}
                  onChange={(e) => setPayrollRules({ ...payrollRules, enable_monday_absent_rule: e.target.checked })}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-800">
                  Enable Rule C (Sunday Worked + Monday Absent = Sunday Wage Forfeited)
                </span>
              </label>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400"
              >
                <Save className="h-3.5 w-3.5" />
                Update Payroll Rules
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Database Maintenance Box */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            Reset Database to Default Seed Data
          </div>
          <p className="text-xs text-rose-700 mt-1">
            Restores all Hyderabad sites, supervisor accounts, operators, and sample attendance back to default clean demonstration state.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All Data
        </button>
      </div>
    </div>
  );
};
