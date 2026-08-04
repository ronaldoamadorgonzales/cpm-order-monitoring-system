'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Calendar, Clock, DollarSign, Edit, Save, X, Printer,
  Plus, Trash2, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react';
import { Order, Venue, ServiceType, Client, MenuCatalog } from '@/types';
import { Toast } from '@/components/Toast';

interface OrderViewClientProps {
  initialOrder: Order;
  user: { userId: string; username: string; role: string };
  venues: Venue[];
  serviceTypes: ServiceType[];
  clients: Client[];
  menus: MenuCatalog[];
}

export const OrderViewClient: React.FC<OrderViewClientProps> = ({
  initialOrder,
  user,
  venues,
  serviceTypes,
  clients,
  menus,
}) => {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Workflow actions states
  const [adminRemarks, setAdminRemarks] = useState('');
  const [remarksActionType, setRemarksActionType] = useState<'CANCEL' | 'RETURN' | null>(null);

  // Form states for edit mode
  const [clientId, setClientId] = useState(order.clientId);
  const [venueId, setVenueId] = useState(order.venueId || '');
  const [customDeliveryAddress, setCustomDeliveryAddress] = useState(order.venue ? order.venue.physicalAddress : (order.customDeliveryAddress || ''));
  const [serviceTypeId, setServiceTypeId] = useState(order.serviceTypeId);
  const [ingressTime, setIngressTime] = useState(() => {
    const timeVal = order.ingressTime;
    if (!timeVal) return '08:00';
    return typeof timeVal === 'string' && timeVal.includes(':') ? timeVal.substring(0, 5) : '08:00';
  });
  const [egressTime, setEgressTime] = useState(() => {
    const timeVal = order.egressTime;
    if (!timeVal) return '17:00';
    return typeof timeVal === 'string' && timeVal.includes(':') ? timeVal.substring(0, 5) : '17:00';
  });
  const [specialInstructions, setSpecialInstructions] = useState(order.specialInstructions || '');
  const [orderDays, setOrderDays] = useState<Array<{
    tempId: string;
    eventDate: string;
    mealPeriods: Array<{ tempId: string; menuId: string | null; mealPeriod: string; pax: number; rate: number | string; customName: string; itemIds: string[] }>;
  }>>(() => {
    return order.orderDays.map((day: any) => ({
      tempId: Math.random().toString(),
      eventDate: day.eventDate.split('T')[0],
      mealPeriods: day.mealPeriods.map((mp: any) => ({
        tempId: Math.random().toString(),
        menuId: mp.menuId || '',
        mealPeriod: mp.mealPeriod || 'Breakfast',
        pax: mp.pax,
        rate: Number(mp.rate || 0),
        customName: mp.customName || '',
        itemIds: mp.mealPeriodItems?.map((mpi: any) => mpi.itemId) || []
      }))
    }));
  });

  const [foodItems, setFoodItems] = useState<Array<{ id: string, itemName: string, category: string }>>([]);

  // Draft form states for meal period entry
  const [draftMealPeriod, setDraftMealPeriod] = useState('Breakfast');
  const [draftMenuId, setDraftMenuId] = useState('');
  const [draftCustomName, setDraftCustomName] = useState('');
  const [draftRate, setDraftRate] = useState<string>('');
  const [draftPax, setDraftPax] = useState<number>(10);
  const [draftItemIds, setDraftItemIds] = useState<string[]>([]);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null);

  const getFilteredMenus = (mealPeriod: string) => {
    if (!menus) return [];
    return menus.filter(menu =>
      menu.menuItems.some(mi => mi.item.category === mealPeriod)
    );
  };

  const resetDraftForm = () => {
    setDraftMealPeriod('Breakfast');
    setDraftMenuId('');
    setDraftCustomName('');
    setDraftRate('');
    setDraftPax(10);
    setDraftItemIds([]);
    setEditingDayIndex(null);
    setEditingMealIndex(null);
  };

  const saveLineItem = (dayIndex: number) => {
    if (!draftMenuId && (!draftCustomName || draftCustomName.trim() === '')) {
      showToast('Please select a menu or enter a custom package name.', 'error');
      return;
    }
    const updated = [...orderDays];
    const newMeal = {
      tempId: editingMealIndex !== null ? updated[dayIndex].mealPeriods[editingMealIndex].tempId : Math.random().toString(),
      menuId: draftMenuId || null,
      mealPeriod: draftMealPeriod,
      pax: Number(draftPax) || 1,
      rate: Number(draftRate || 0),
      customName: draftCustomName || '',
      itemIds: draftItemIds,
    };

    if (editingMealIndex !== null && editingDayIndex === dayIndex) {
      updated[dayIndex].mealPeriods[editingMealIndex] = newMeal as any;
    } else {
      updated[dayIndex].mealPeriods.push(newMeal as any);
    }
    setOrderDays(updated);
    resetDraftForm();
  };

  const editLineItem = (dayIndex: number, mealIndex: number) => {
    const meal = orderDays[dayIndex].mealPeriods[mealIndex];
    setEditingDayIndex(dayIndex);
    setEditingMealIndex(mealIndex);
    setDraftMealPeriod(meal.mealPeriod);
    setDraftMenuId(meal.menuId || '');
    setDraftCustomName(meal.customName || '');
    setDraftRate(String(meal.rate));
    setDraftPax(meal.pax);
    setDraftItemIds(meal.itemIds || []);
  };

  const handleDraftMenuChange = (val: string) => {
    if (val === '') {
      setDraftMenuId('');
      setDraftRate('0');
      setDraftItemIds([]);
    } else {
      const menu = menus?.find(m => m.id === val);
      if (menu) {
        setDraftMenuId(val);
        setDraftRate(String(menu.baseRate));
        setDraftItemIds(menu.menuItems.map(mi => mi.itemId));
      }
    }
  };

  const handleDraftMealPeriodChange = (val: string) => {
    setDraftMealPeriod(val);
    setDraftMenuId('');
    setDraftRate('0');
    setDraftItemIds([]);
  };

  useEffect(() => {
    fetch('/api/catalogs/items')
      .then(res => res.json())
      .then(data => {
        if (data.success) setFoodItems(data.data);
      })
      .catch(err => console.error(err));
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // State constraint check
  const isEditable = order.status.statusName === 'DRAFT' || order.status.statusName === 'FOR_UPDATE';
  const hasAccess = user.role === 'ADMIN' || BigInt(user.userId) === BigInt(order.createdByUserId);

  const calculateEstimate = () => {
    let total = 0;
    orderDays.forEach((day) => {
      day.mealPeriods.forEach((meal) => {
        total += Number(meal.rate) * meal.pax;
      });
    });
    return total;
  };

  const handleAddDay = () => {
    setOrderDays([
      ...orderDays,
      {
        tempId: Math.random().toString(),
        eventDate: new Date().toISOString().split('T')[0],
        mealPeriods: []
      }
    ]);
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (orderDays.length <= 1) return;
    setOrderDays(orderDays.filter((_, idx) => idx !== dayIndex));
    if (editingDayIndex === dayIndex) {
      resetDraftForm();
    } else if (editingDayIndex !== null && editingDayIndex > dayIndex) {
      setEditingDayIndex(editingDayIndex - 1);
    }
  };

  const handleUpdateDayDate = (dayIdx: number, dateStr: string) => {
    const updated = [...orderDays];
    updated[dayIdx].eventDate = dateStr;
    setOrderDays(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) {
      showToast('This order has been locked and cannot be updated.', 'error');
      return;
    }

    // Payload Validations
    if (!venueId && (!customDeliveryAddress || customDeliveryAddress.trim() === '')) {
      showToast('Please specify a delivery address.', 'error');
      return;
    }

    for (const day of orderDays) {
      if (!day.eventDate) {
        showToast('All days must have a date scheduled.', 'error');
        return;
      }
      for (const meal of day.mealPeriods) {
        if (meal.pax <= 0) {
          showToast('Guest count must be greater than zero.', 'error');
          return;
        }
        if (!meal.menuId && meal.itemIds.length === 0) {
          showToast('Dynamic packages must have at least one food item selected.', 'error');
          return;
        }
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          venueId: venueId ? venueId : null,
          customDeliveryAddress: venueId ? null : customDeliveryAddress,
          serviceTypeId,
          ingressTime,
          egressTime,
          specialInstructions,
          orderDays: orderDays.map((d) => ({
            eventDate: d.eventDate,
            mealPeriods: d.mealPeriods.map((m) => ({
              menuId: m.menuId === '' ? null : m.menuId,
              mealPeriod: m.mealPeriod,
              pax: m.pax,
              rate: Number(m.rate),
              customName: m.customName,
              itemIds: m.itemIds,
            })),
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Order details updated successfully!', 'success');
        setIsEditing(false);
        // Refresh local details
        const refreshRes = await fetch(`/api/orders/${order.id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setOrder(refreshData.data);
        }
      } else {
        showToast(data.error?.message || 'Failed to update order.', 'error');
      }
    } catch (e) {
      showToast('An error occurred during submission.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderAction = async (action: string, remarksText = '') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: remarksText }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminRemarks('');
        setRemarksActionType(null);
        showToast(`Successfully completed: ${action === 'cancel' ? 'Cancellation' : action}`, 'success');
        
        // Refresh local details
        const refreshRes = await fetch(`/api/orders/${order.id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setOrder(refreshData.data);
        }
      } else {
        showToast(data.error?.message || `Failed to perform ${action}.`, 'error');
      }
    } catch (e) {
      showToast('Error connecting to services. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerPDFDownload = async () => {
    if (!order.pdfGeneratedFlag) {
      showToast('PDF invoice has not been generated yet. Please approve the order first.', 'error');
      return;
    }
    window.open(`/api/orders/${order.id}/pdf`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase tracking-wider mb-2.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to monitoring
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              Catering Booking INV-{order.id}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border capitalize ${
              order.status.statusName === 'APPROVED' ? 'bg-emerald-100 border-emerald-250 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
              order.status.statusName === 'PENDING_APPROVAL' ? 'bg-amber-100 border-amber-250 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
              order.status.statusName === 'CANCELLED' ? 'bg-rose-100 border-rose-250 text-rose-800 dark:bg-rose-950/30 dark:text-rose-455' :
              'bg-slate-100 border-slate-250 text-slate-700 dark:bg-slate-800 dark:text-slate-350'
            }`}>
              {order.status.statusName.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {order.pdfGeneratedFlag && (
            <button
              onClick={triggerPDFDownload}
              className="flex items-center px-4 py-2 border border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-sky-400 rounded-lg text-sm font-bold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 mr-2" /> Download invoice PDF
            </button>
          )}

          {isEditable && hasAccess && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Edit className="w-4 h-4 mr-2" /> Modify Booking
            </button>
          )}
        </div>
      </div>

      {/* Main info panel */}
      {isEditing ? (
        /* EDITABLE VIEW (FORM) */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-250 dark:border-slate-850 pb-2">
              Update Ordering Data
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Client Profile</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {clients.map((c) => {
                    const name = c.clientType === 'ORGANIZATION' ? c.organizationName : `${c.firstName} ${c.lastName}`;
                    return <option key={c.id} value={c.id}>{name} ({c.clientType})</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Service Type</label>
                <select
                  value={serviceTypeId}
                  onChange={(e) => setServiceTypeId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>{st.serviceName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Event Venue / Location</label>
              <select
                value={venueId}
                onChange={(e) => {
                  const selectedVenueId = e.target.value;
                  setVenueId(selectedVenueId);
                  if (selectedVenueId) {
                    const v = venues.find(venue => venue.id.toString() === selectedVenueId);
                    setCustomDeliveryAddress(v ? v.physicalAddress : '');
                  } else {
                    setCustomDeliveryAddress('');
                  }
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 mb-4 font-sans"
              >
                <option value="">-- Custom Delivery Address --</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.venueName} (Cap: {v.capacity})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {venueId ? "Venue Physical Address" : "Delivery Address"}
              </label>
              <input
                type="text"
                value={customDeliveryAddress}
                onChange={(e) => setCustomDeliveryAddress(e.target.value)}
                required={!venueId}
                disabled={!!venueId}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-400"
                placeholder={venueId ? "" : "Enter delivery address"}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ingress Setup Time</label>
                <input
                  type="time"
                  value={ingressTime}
                  onChange={(e) => setIngressTime(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Egress Cleanup Time</label>
                <input
                  type="time"
                  value={egressTime}
                  onChange={(e) => setEgressTime(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Special Instructions / Remarks</label>
              <textarea
                rows={3}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter special requests, food restrictions, server guidelines..."
              />
            </div>
          </div>

          {/* Schedule wizard list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-250 dark:border-slate-850 pb-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                Event Schedule & Catering Items
              </h3>
              <button
                type="button"
                onClick={handleAddDay}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Day
              </button>
            </div>

            <div className="space-y-6">
              {orderDays.map((day, dIdx) => (
                <div key={day.tempId} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Day {dIdx + 1}:</span>
                      <input
                        type="date"
                        value={day.eventDate}
                        onChange={(e) => handleUpdateDayDate(dIdx, e.target.value)}
                        required
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingDayIndex !== dIdx && (
                        <button
                          type="button"
                          onClick={() => {
                            resetDraftForm();
                            setEditingDayIndex(dIdx);
                          }}
                          className="py-1 px-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-sky-400 rounded-lg text-xs font-bold"
                        >
                          + Add Meal Period
                        </button>
                      )}
                      {orderDays.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDay(dIdx)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold pl-2 border-l border-slate-200 dark:border-slate-800"
                        >
                          Remove Day
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meal periods summary table */}
                  {day.mealPeriods.length > 0 && (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Period</th>
                            <th className="px-4 py-2 font-semibold">Item</th>
                            <th className="px-4 py-2 font-semibold text-right">Rate</th>
                            <th className="px-4 py-2 font-semibold text-right">Pax</th>
                            <th className="px-4 py-2 font-semibold text-right">Subtotal</th>
                            <th className="px-4 py-2 font-semibold text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                          {day.mealPeriods.map((meal, mIdx) => {
                            const subtotal = Number(meal.rate) * meal.pax;
                            const selectedMenu = menus.find(m => m.id === meal.menuId);
                            const itemName = meal.customName || selectedMenu?.title || 'Custom Package';
                            return (
                              <tr key={meal.tempId} className={editingDayIndex === dIdx && editingMealIndex === mIdx ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{meal.mealPeriod}</td>
                                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{itemName}</td>
                                <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">₱{Number(meal.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">{meal.pax}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => editLineItem(dIdx, mIdx)}
                                    className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-semibold disabled:opacity-50"
                                    disabled={editingDayIndex === dIdx && editingMealIndex === mIdx}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...orderDays];
                                      updated[dIdx].mealPeriods = updated[dIdx].mealPeriods.filter((_, idx) => idx !== mIdx);
                                      setOrderDays(updated);
                                      if (editingDayIndex === dIdx && editingMealIndex === mIdx) {
                                        resetDraftForm();
                                      } else if (editingDayIndex === dIdx && editingMealIndex !== null && editingMealIndex > mIdx) {
                                        setEditingMealIndex(editingMealIndex - 1);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 text-xs font-semibold"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Add/Edit Form Area */}
                  {editingDayIndex === dIdx && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800/50 shadow-sm space-y-4">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                        {editingMealIndex !== null ? 'Edit Line Item' : 'Add Line Item'}
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-3">
                        <div className="w-full md:w-36">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Period</label>
                          <select
                            value={draftMealPeriod}
                            onChange={(e) => handleDraftMealPeriodChange(e.target.value)}
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                          >
                            <option value="Breakfast">Breakfast</option>
                            <option value="AM Snack">AM Snack</option>
                            <option value="Lunch">Lunch</option>
                            <option value="PM Snack">PM Snack</option>
                            <option value="Dinner">Dinner</option>
                          </select>
                        </div>

                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Package / Menu</label>
                          <select
                            value={draftMenuId}
                            onChange={(e) => handleDraftMenuChange(e.target.value)}
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                          >
                            <option value="">-- Build Dynamic Group --</option>
                            {getFilteredMenus(draftMealPeriod).map((m) => (
                              <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full md:w-28">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Rate / Pax</label>
                          <input
                            type="number"
                            value={draftRate}
                            onChange={(e) => setDraftRate(e.target.value)}
                            min={0}
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                          />
                        </div>

                        <div className="w-full md:w-24">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Pax</label>
                          <input
                            type="number"
                            value={draftPax}
                            onChange={(e) => setDraftPax(parseInt(e.target.value) || 0)}
                            required
                            min={1}
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>

                      {(!draftMenuId || (draftMenuId && draftItemIds.sort().join(',') !== (menus.find(m => m.id === draftMenuId)?.menuItems.map(mi => mi.itemId).sort().join(',') || ''))) && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Custom Package Name (Optional)</label>
                          <input
                            type="text"
                            value={draftCustomName}
                            onChange={(e) => setDraftCustomName(e.target.value)}
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                            placeholder="e.g. Special VIP Lunch"
                          />
                        </div>
                      )}

                      <div className="pt-2">
                        <details className="group border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950/50">
                          <summary className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer list-none flex justify-between items-center outline-none">
                            <span>Selected Food Items ({draftItemIds.length})</span>
                            <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                          </summary>
                          <div className="p-4 border-t border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {foodItems.map(fi => (
                                <label key={fi.id} className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={draftItemIds.includes(fi.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      let newIds = [...draftItemIds];
                                      if (checked) {
                                        newIds.push(fi.id);
                                      } else {
                                        newIds = newIds.filter(id => id !== fi.id);
                                      }
                                      setDraftItemIds(newIds);
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="truncate" title={fi.itemName}>{fi.itemName}</span>
                                </label>
                              ))}
                              {foodItems.length === 0 && (
                                <div className="text-xs text-slate-500 italic col-span-full">No food items available.</div>
                              )}
                            </div>
                          </div>
                        </details>
                      </div>

                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={resetDraftForm}
                          className="py-1.5 px-4 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveLineItem(dIdx)}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
                        >
                          {editingMealIndex !== null ? 'Save Changes' : 'Add Item'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">New Grand Total Estimate:</p>
                <p className="text-2xl font-extrabold text-blue-650 dark:text-sky-400 mt-1">
                  PHP {calculateEstimate().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 border border-slate-350 dark:border-slate-755 text-slate-650 dark:text-slate-350 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-sm font-bold shadow flex items-center transition-all"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Revisions
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* READ ONLY VIEW (Locked or Display mode) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Blocks */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Order Data Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Client Profile</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {order.client.clientType === 'ORGANIZATION'
                      ? order.client.organizationName
                      : `${order.client.firstName} ${order.client.lastName}`}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">
                    {order.client.email} | {order.client.phone}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Service Type</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {order.serviceType.serviceName}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {order.venue ? 'Event Venue' : 'Delivery Address'}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {order.venue 
                      ? `${order.venue.venueName} (${order.venue.physicalAddress})`
                      : order.customDeliveryAddress
                    }
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ingress Setup Time</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {order.ingressTime ? String(order.ingressTime).substring(0, 5) : 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Egress Cleanup Time</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    {order.egressTime ? String(order.egressTime).substring(0, 5) : 'N/A'}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Special Instructions</span>
                  <span className="text-slate-655 dark:text-slate-350 italic">
                    {order.specialInstructions || 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Day Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Applied Catering Schedule
              </h3>

              <div className="space-y-6">
                {order.orderDays.map((day: any, idx: number) => {
                  const groupedMeals = day.mealPeriods.reduce((acc: any, meal: any) => {
                    const period = meal.mealPeriod || 'Other';
                    if (!acc[period]) acc[period] = [];
                    acc[period].push(meal);
                    return acc;
                  }, {});
                  
                  return (
                    <div key={day.id} className="bg-slate-50 dark:bg-slate-950/30 rounded-xl p-4 border border-slate-200 dark:border-slate-850 space-y-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-2">
                        <Calendar className="w-4 h-4 mr-1.5 text-blue-600 dark:text-sky-400" />
                        Day {idx + 1}: {new Date(day.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>

                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-left text-sm">
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                            {Object.entries(groupedMeals).map(([period, meals]: [string, any]) => (
                              <React.Fragment key={period}>
                                <tr className="bg-slate-100 dark:bg-slate-800">
                                  <td colSpan={4} className="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">
                                    {period}
                                  </td>
                                </tr>
                                {meals.map((meal: any) => {
                                  const subtotal = Number(meal.rate) * meal.pax;
                                  const itemName = meal.customName || meal.menu?.title || 'Dynamic Package';
                                  const foodItems = meal.mealPeriodItems?.map((i: any) => i.item.itemName).join(', ') || 'N/A';
                                  return (
                                    <tr key={meal.id}>
                                      <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">{itemName}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Items: {foodItems}</div>
                                      </td>
                                      <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">
                                        ₱{Number(meal.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">
                                        {meal.pax} Pax
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                        ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revision History & Audit Trail */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Revision Audit Ledger
              </h3>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {order.history && order.history.map((log: any, logIdx: number) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {logIdx !== order.history.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-8 ring-white dark:ring-slate-900">
                              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-slate-805 dark:text-slate-200 font-medium">
                                {log.remarks}
                              </p>
                              <div className="mt-1 flex items-center space-x-2 text-xs text-slate-400">
                                <span>State: {log.fromStatus?.statusName || 'NULL'} → <strong>{log.toStatus?.statusName}</strong></span>
                              </div>
                            </div>
                            <div className="text-right text-xs whitespace-nowrap text-slate-400">
                              <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar / Cost Summary */}
          <div className="space-y-6">
            {/* Booking Actions Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Booking Actions
              </h3>
              
              {remarksActionType ? (
                <div className="space-y-3">
                  <label htmlFor="remarksText" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Provide {remarksActionType === 'CANCEL' ? 'Cancellation Reason' : 'Update Guidance Instructions'} (Required)
                  </label>
                  <input
                    type="text"
                    id="remarksText"
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Explain why this booking is being ${remarksActionType === 'CANCEL' ? 'cancelled' : 'returned'}...`}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => { setRemarksActionType(null); setAdminRemarks(''); }}
                      className="py-1 px-3 border border-slate-350 dark:border-slate-755 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleOrderAction(remarksActionType === 'CANCEL' ? 'cancel' : 'return', adminRemarks)}
                      className="py-1 px-3 bg-red-600 text-white rounded text-xs font-bold"
                    >
                      Confirm {remarksActionType === 'CANCEL' ? 'Cancellation' : 'Return'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* USER / Admin submitting draft */}
                  {(order.status.statusName === 'DRAFT' || order.status.statusName === 'FOR_UPDATE') && (
                    <>
                      <button
                        onClick={() => handleOrderAction('submit')}
                        disabled={actionLoading}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-sm font-bold flex items-center justify-center transition-all cursor-pointer"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />} Submit Request
                      </button>
                      
                      <button
                        onClick={() => {
                          if (user.role === 'ADMIN') {
                            setRemarksActionType('CANCEL');
                          } else {
                            if (confirm('Are you sure you want to cancel this booking request?')) {
                              handleOrderAction('cancel');
                            }
                          }
                        }}
                        disabled={actionLoading}
                        className="w-full py-2.5 px-4 border border-rose-350 hover:bg-rose-50 dark:border-rose-950/30 dark:hover:bg-rose-950/20 text-rose-600 disabled:opacity-60 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}

                  {/* ADMIN / USER pending approval actions */}
                  {order.status.statusName === 'PENDING_APPROVAL' && (
                    <>
                      {user.role === 'ADMIN' && (
                        <>
                          <button
                            onClick={() => handleOrderAction('approve')}
                            disabled={actionLoading}
                            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-sm font-bold flex items-center justify-center transition-all cursor-pointer"
                          >
                            {actionLoading ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />} Approve Booking
                          </button>
                          
                          <button
                            onClick={() => setRemarksActionType('RETURN')}
                            disabled={actionLoading}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
                          >
                            Return for Update
                          </button>

                          <button
                            onClick={() => setRemarksActionType('CANCEL')}
                            disabled={actionLoading}
                            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
                          >
                            Cancel Booking
                          </button>
                        </>
                      )}
                      
                      {user.role === 'USER' && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this booking request?')) {
                              handleOrderAction('cancel');
                            }
                          }}
                          disabled={actionLoading}
                          className="w-full py-2.5 px-4 border border-rose-350 hover:bg-rose-50 dark:border-rose-950/30 dark:hover:bg-rose-950/20 text-rose-600 disabled:opacity-60 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </>
                  )}

                  {order.status.statusName === 'APPROVED' && (
                    <p className="text-xs text-slate-500 text-center italic py-2">
                      This order has been approved and locked.
                    </p>
                  )}

                  {order.status.statusName === 'CANCELLED' && (
                    <p className="text-xs text-slate-500 text-center italic py-2">
                      This order has been cancelled and cannot be updated.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Billing summary card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Order Billing
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Service Fee:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Included</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Taxes & Levies:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Included</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Grand Total:</span>
                  <span className="text-xl font-extrabold text-blue-600 dark:text-sky-400">
                    ₱{Number(order.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Metadata Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1.5">
                Audit Info
              </span>
              <div className="text-xs space-y-2">
                <p className="text-slate-550">
                  <span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleString()}
                </p>
                <p className="text-slate-555">
                  <span className="font-semibold">Last Modified:</span> {new Date(order.updatedAt).toLocaleString()}
                </p>
                {!isEditable && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start space-x-2 text-slate-500">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>State locks are active. Modifications are locked unless order is returned for updates.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
