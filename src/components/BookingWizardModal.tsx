import React, { useState, useEffect } from 'react';
import { CalendarClock, X, ChevronRight, AlertCircle, ArrowLeft, Plus, CheckCircle2, RefreshCw } from 'lucide-react';
import { CatalogData, Client, Order } from '../types';

interface BookingWizardModalProps {
  onClose: () => void;
  onSuccess: (updatedOrderId: string | null) => void;
  catalogs: CatalogData | null;
  clients: Client[];
  editOrder?: Order | null;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  onClose,
  onSuccess,
  catalogs,
  clients,
  editOrder,
}) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardClientId, setWizardClientId] = useState('');
  const [wizardVenueId, setWizardVenueId] = useState('');
  const [wizardCustomAddress, setWizardCustomAddress] = useState('');
  const [wizardServiceTypeId, setWizardServiceTypeId] = useState('');
  const [wizardIngressTime, setWizardIngressTime] = useState('08:00');
  const [wizardEgressTime, setWizardEgressTime] = useState('17:00');
  const [wizardInstructions, setWizardInstructions] = useState('');
  const [wizardDays, setWizardDays] = useState<Array<{
    tempId: string;
    eventDate: string;
    mealPeriods: Array<{ tempId: string; menuId: string; pax: number }>;
  }>>([]);
  const [wizardError, setWizardError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);


  useEffect(() => {
    if (editOrder) {
      setWizardClientId(editOrder.clientId);
      setWizardCustomAddress(editOrder.customDeliveryAddress || '');
      setWizardServiceTypeId(editOrder.serviceTypeId);

      const formatTime = (timeVal: any) => {
        if (!timeVal) return '';
        if (typeof timeVal === 'string' && timeVal.includes(':')) {
          const parts = timeVal.split(':');
          return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return '';
      };

      setWizardIngressTime(formatTime(editOrder.ingressTime));
      setWizardEgressTime(formatTime(editOrder.egressTime));
      setWizardInstructions(editOrder.specialInstructions || '');

      const days = editOrder.orderDays.map((day: any) => ({
        tempId: Math.random().toString(),
        eventDate: day.eventDate.split('T')[0],
        mealPeriods: day.mealPeriods.map((meal: any) => ({
          tempId: Math.random().toString(),
          menuId: meal.menuId,
          pax: meal.pax,
        })),
      }));
      setWizardDays(days);
    } else {
      // Defaults for create
      setWizardClientId('');
      setWizardCustomAddress('');
      setWizardServiceTypeId('');
      setWizardIngressTime('08:00');
      setWizardEgressTime('17:00');
      setWizardInstructions('');
      setWizardDays([
        {
          tempId: Math.random().toString(),
          eventDate: new Date().toISOString().split('T')[0],
          mealPeriods: [{ tempId: Math.random().toString(), menuId: '', pax: 10 }]
        }
      ]);
    }
  }, [editOrder]);

  const addWizardDay = () => {
    setWizardDays([
      ...wizardDays,
      {
        tempId: Math.random().toString(),
        eventDate: new Date().toISOString().split('T')[0],
        mealPeriods: [{ tempId: Math.random().toString(), menuId: '', pax: 10 }]
      }
    ]);
  };

  const removeWizardDay = (dayIndex: number) => {
    if (wizardDays.length <= 1) return;
    setWizardDays(wizardDays.filter((_, idx) => idx !== dayIndex));
  };

  const addMealPeriod = (dayIndex: number) => {
    const updated = [...wizardDays];
    updated[dayIndex].mealPeriods.push({
      tempId: Math.random().toString(),
      menuId: '',
      pax: 10
    });
    setWizardDays(updated);
  };

  const removeMealPeriod = (dayIndex: number, mealIndex: number) => {
    const updated = [...wizardDays];
    if (updated[dayIndex].mealPeriods.length <= 1) return;
    updated[dayIndex].mealPeriods = updated[dayIndex].mealPeriods.filter((_, idx) => idx !== mealIndex);
    setWizardDays(updated);
  };

  const updateMealPeriod = (dayIndex: number, mealIndex: number, fields: Record<string, any>) => {
    const updated = [...wizardDays];
    updated[dayIndex].mealPeriods[mealIndex] = {
      ...updated[dayIndex].mealPeriods[mealIndex],
      ...fields
    };
    setWizardDays(updated);
  };

  const updateDayDate = (dayIndex: number, eventDate: string) => {
    const updated = [...wizardDays];
    updated[dayIndex].eventDate = eventDate;
    setWizardDays(updated);
  };

  const calculateWizardTotal = () => {
    if (!catalogs) return 0;
    let total = 0;
    wizardDays.forEach((day) => {
      day.mealPeriods.forEach((meal) => {
        const menu = catalogs.menus.find((m) => m.id === meal.menuId);
        if (menu) {
          total += Number(menu.baseRate) * meal.pax;
        }
      });
    });
    return total;
  };

  const handleWizardSubmit = async () => {
    setWizardError('');

    if (!wizardClientId || !wizardServiceTypeId) {
      setWizardError('Please select a client and service type.');
      return;
    }

    if (!wizardCustomAddress || wizardCustomAddress.trim() === '') {
      setWizardError('Please specify a delivery address.');
      return;
    }

    for (const day of wizardDays) {
      if (!day.eventDate) {
        setWizardError('All days must have a date specified.');
        return;
      }
      for (const meal of day.mealPeriods) {
        if (!meal.menuId) {
          setWizardError('All meal periods must select a menu.');
          return;
        }
        if (meal.pax <= 0) {
          setWizardError('Pax must be greater than 0.');
          return;
        }
      }
    }

    const payload = {
      clientId: wizardClientId,
      venueId: null,
      customDeliveryAddress: wizardCustomAddress,
      serviceTypeId: wizardServiceTypeId,
      ingressTime: wizardIngressTime,
      egressTime: wizardEgressTime,
      specialInstructions: wizardInstructions,
      orderDays: wizardDays.map((d) => ({
        eventDate: d.eventDate,
        mealPeriods: d.mealPeriods.map((m) => ({
          menuId: m.menuId,
          pax: m.pax,
        })),
      })),
    };

    setActionLoading(true);
    try {
      const url = editOrder ? `/api/orders/${editOrder.id}` : '/api/orders';
      const method = editOrder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(editOrder ? editOrder.id : null);
        onClose();
      } else {
        setWizardError(data.error?.message || 'Failed to save booking.');
      }
    } catch (e) {
      setWizardError('An error occurred while saving the order.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <CalendarClock className="w-5 h-5 mr-2 text-blue-600 dark:text-sky-400" />
              {editOrder ? 'Modify Catering Booking' : 'Launch New Catering Booking Wizard'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Catering & Packed Meals (CPM) Operational Wizard</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center space-x-8">
          <span className={`text-sm font-bold flex items-center ${wizardStep === 1 ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono mr-2 ${wizardStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>1</span>
            Basic Order Details
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className={`text-sm font-bold flex items-center ${wizardStep === 2 ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono mr-2 ${wizardStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>2</span>
            Multi-Day Meal Schedule
          </span>
        </div>

        {/* Error Warning */}
        {wizardError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>{wizardError}</span>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {wizardStep === 1 ? (
            /* STEP 1: INFO */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="wizardClient" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select Client / Profile</label>
                  <select
                    id="wizardClient"
                    value={wizardClientId}
                    onChange={(e) => setWizardClientId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">-- Choose Profile --</option>
                    {clients.map((c) => {
                      const name = c.clientType === 'ORGANIZATION'
                        ? c.organizationName
                        : `${c.firstName} ${c.lastName}`;
                      return <option key={c.id} value={c.id}>{name} ({c.clientType})</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="wizardService" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Service Type</label>
                  <select
                    id="wizardService"
                    value={wizardServiceTypeId}
                    onChange={(e) => setWizardServiceTypeId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">-- Choose Service Type --</option>
                    {catalogs?.serviceTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.serviceName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="wizardAddress" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Delivery Address</label>
                <input
                  type="text"
                  id="wizardAddress"
                  value={wizardCustomAddress}
                  onChange={(e) => setWizardCustomAddress(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  placeholder="Enter delivery address"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="ingress" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ingress Time (24h format)</label>
                  <input
                    type="time"
                    id="ingress"
                    value={wizardIngressTime}
                    onChange={(e) => setWizardIngressTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="egress" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Egress Time (24h format)</label>
                  <input
                    type="time"
                    id="egress"
                    value={wizardEgressTime}
                    onChange={(e) => setWizardEgressTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="instructions" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Special Instructions / Remarks</label>
                <textarea
                  id="instructions"
                  rows={3}
                  value={wizardInstructions}
                  onChange={(e) => setWizardInstructions(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none resize-none"
                  placeholder="Enter food allergies, server setup, or delivery directions..."
                />
              </div>
            </div>
          ) : (
            /* STEP 2: MULTI-DAY SCHEDULE */
            <div className="space-y-6">

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Booking Days</span>
                <button
                  type="button"
                  onClick={addWizardDay}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Day
                </button>
              </div>

              <div className="space-y-6">
                {wizardDays.map((day, dIdx) => (
                  <div key={day.tempId} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Day {dIdx + 1}:</span>
                        <input
                          type="date"
                          value={day.eventDate}
                          onChange={(e) => updateDayDate(dIdx, e.target.value)}
                          required
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => addMealPeriod(dIdx)}
                          className="py-1 px-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-sky-400 rounded-lg text-xs font-bold"
                        >
                          + Add Meal Period
                        </button>
                        {wizardDays.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWizardDay(dIdx)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold pl-2 border-l border-slate-200 dark:border-slate-800"
                          >
                            Remove Day
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meal periods sub-table */}
                    <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                      {day.mealPeriods.map((meal, mIdx) => {
                        const selectedMenu = catalogs?.menus.find((m) => m.id === meal.menuId);
                        const subtotal = selectedMenu ? Number(selectedMenu.baseRate) * meal.pax : 0;

                        return (
                          <div key={meal.tempId} className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                            <div className="flex-1 w-full">
                              <select
                                value={meal.menuId}
                                onChange={(e) => updateMealPeriod(dIdx, mIdx, { menuId: e.target.value })}
                                required
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                              >
                                <option value="">-- Select Menu Catalog --</option>
                                {catalogs?.menus.map((m) => (
                                  <option key={m.id} value={m.id}>{m.title} (PHP {Number(m.baseRate).toFixed(2)}/pax)</option>
                                ))}
                              </select>
                            </div>

                            <div className="w-full sm:w-32 flex items-center space-x-2">
                              <input
                                type="number"
                                value={meal.pax}
                                onChange={(e) => updateMealPeriod(dIdx, mIdx, { pax: parseInt(e.target.value) || 0 })}
                                required
                                min={1}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                                placeholder="Pax count"
                              />
                              <span className="text-xs text-slate-500">Pax</span>
                            </div>

                            <div className="w-full sm:w-36 text-right text-sm font-semibold">
                              ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>

                            {day.mealPeriods.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMealPeriod(dIdx, mIdx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Booking Cost Estimation:</p>
                  <p className="text-2xl font-extrabold text-blue-600 dark:text-sky-400 mt-1">PHP {calculateWizardTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between">
          <div>
            {wizardStep === 2 && (
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            {wizardStep === 1 ? (
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow flex items-center"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleWizardSubmit()}
                disabled={actionLoading}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-sm font-bold shadow flex items-center transition-all"
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {editOrder ? 'Save Revisions' : 'Launch Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
