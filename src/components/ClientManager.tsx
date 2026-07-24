import React, { useState } from 'react';
import { UserPlus, Edit, Search, X, CheckCircle2, AlertCircle, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import { Client, CatalogData } from '../types';

interface ClientManagerProps {
  clients: Client[];
  catalogs: CatalogData | null;
  onRefresh: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  catalogs,
  onRefresh,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit / Create client modals
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'ORGANIZATION'>('ORGANIZATION');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setEditingClient(null);
    setClientType('ORGANIZATION');
    setFirstName('');
    setLastName('');
    setOrganizationName('');
    setOfficeName('');
    setEmail('');
    setPhone('');
    setLocation('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setClientType(client.clientType);
    setFirstName(client.firstName || '');
    setLastName(client.lastName || '');
    setOrganizationName(client.organizationName || '');
    setOfficeName(client.office?.officeName || '');
    setEmail(client.email);
    setPhone(client.phone);
    setLocation(client.location || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    const payload = {
      clientType,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      organizationName: organizationName || undefined,
      officeName: clientType === 'ORGANIZATION' && officeName ? officeName : undefined,
      email,
      phone,
      location:  location || undefined,
    };

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingClient ? 'Client registry updated.' : 'Client registered successfully.', 'success');
        setShowModal(false);
        onRefresh();
      } else {
        setFormError(data.error?.message || 'Failed to save client profile.');
      }
    } catch (err) {
      setFormError('Error connecting to services.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filtering
  const filteredClients = clients.filter((c) => {
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const orgName = (c.organizationName || '').toLowerCase();
    const contact = `${c.email} ${c.phone}`.toLowerCase();
    const loc = (c.location || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || orgName.includes(query) || contact.includes(query) || loc.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customer & Client Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Browse, search, register, or edit organization and individual client profiles.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-755 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow flex items-center self-start"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Register New Client Profile
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, company, email, phone, or office..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
              <th className="py-4 px-6 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Identity</th>
              <th className="py-4 px-6 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Type</th>
              <th className="py-4 px-6 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Details</th>
              <th className="py-4 px-6 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department / Office</th>
              <th className="py-4 px-6 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Business Location</th>
              <th className="py-4 px-6 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 px-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No matching client profiles found.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const displayName = client.clientType === 'ORGANIZATION'
                  ? client.organizationName
                  : `${client.firstName} ${client.lastName}`;
                
                const subLabel = client.clientType === 'ORGANIZATION'
                  ? `Contact: ${client.firstName} ${client.lastName}`
                  : (client.organizationName ? `Company: ${client.organizationName}` : '');

                return (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900 dark:text-white block">{displayName}</span>
                      {subLabel && <span className="text-xs text-slate-450 block mt-0.5">{subLabel}</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        client.clientType === 'ORGANIZATION'
                          ? 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:text-sky-400'
                          : 'bg-indigo-100 border-indigo-200 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
                      }`}>
                        {client.clientType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center space-x-1.5 text-slate-655 dark:text-slate-350">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-655 dark:text-slate-350 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-355 font-medium">
                      {client.office?.officeName || <span className="text-slate-400 italic">None (External)</span>}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                      {client.location ? (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-xs">{client.location}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white"
                        title="Edit Profile"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL: REGISTER / EDIT CLIENT */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                {editingClient ? 'Modify Client Profile' : 'Register New client Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-650 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {formError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setClientType('ORGANIZATION')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-all ${
                        clientType === 'ORGANIZATION'
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-sky-400'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Company/Organization
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType('INDIVIDUAL')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-all ${
                        clientType === 'INDIVIDUAL'
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-sky-400'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Individual
                    </button>
                  </div>
                </div>

                {clientType === 'ORGANIZATION' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company / Organization</label>
                      <input
                        type="text"
                        required
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contact First Name</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contact Last Name</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Business Location</label>
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                        placeholder="e.g. Suite 404, Building A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department / Office (Optional)</label>
                      <input
                        type="text"
                        value={officeName}
                        onChange={(e) => setOfficeName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                        placeholder="e.g. Finance Dept"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">First Name</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Last Name</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company / Organization (Optional)</label>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                        placeholder="e.g. Associated company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Business Location</label>
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                        placeholder="e.g. Suite 404, Building A"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                      placeholder="client@mail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                      placeholder="09XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 border border-slate-350 dark:border-slate-755 text-slate-655 dark:text-slate-350 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-750 disabled:opacity-60 text-white rounded-lg text-sm font-bold shadow flex items-center transition-all"
                >
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingClient ? 'Update Profile' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
