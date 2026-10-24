import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  createAdminZone,
  getAdminZones,
  updateAdminZone,
} from '../../api/adminApi.js'
import DataTable from '../../components/admin/DataTable.jsx'
import ZoneForm from '../../components/admin/ZoneForm.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import { formatMoney } from '../../utils/formatMoney.js'

export function AdminZonesPage() {
  const [zones, setZones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function fetchZones() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAdminZones()
      setZones(data.zones || [])
    } catch (err) {
      setError(err.message || 'Failed to load delivery zones')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  async function handleCreateZone(payload) {
    try {
      setIsSubmitting(true)
      await createAdminZone(payload)
      toast.success('Delivery zone added!')
      setIsAddZoneOpen(false)
      fetchZones()
    } catch (err) {
      toast.error(err.message || 'Could not add zone')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateZone(payload) {
    if (!editingZone) return
    try {
      setIsSubmitting(true)
      await updateAdminZone(editingZone.id, payload)
      toast.success('Delivery zone updated!')
      setEditingZone(null)
      fetchZones()
    } catch (err) {
      toast.error(err.message || 'Could not update zone')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    {
      header: 'Pincode',
      render: (zone) => (
        <span className="font-mono font-bold text-espresso text-base">
          {zone.pincode}
        </span>
      ),
    },
    {
      header: 'Covered Area / City',
      render: (zone) => (
        <span className="font-semibold text-espresso">{zone.areaName}</span>
      ),
    },
    {
      header: 'Delivery Fee',
      render: (zone) => (
        <span className="font-bold text-terracotta">
          {zone.deliveryFeePaise === 0 ? 'FREE (₹0)' : formatMoney(zone.deliveryFeePaise)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (zone) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            zone.isActive
              ? 'bg-forest-light text-forest border border-forest/30'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {zone.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (zone) => (
        <button
          type="button"
          onClick={() => setEditingZone(zone)}
          className="text-xs font-semibold text-terracotta hover:underline"
        >
          Edit Zone
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-husk pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
            Logistics & Coverage
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso">
            Delivery Zones
          </h1>
          <p className="mt-1 text-xs text-espresso/60">
            Configure serviceable pincodes, refrigerated delivery fees, and active regions
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddZoneOpen(true)}
          className="self-start sm:self-auto"
        >
          + Add New Zone
        </Button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchZones} />}

      <DataTable
        columns={columns}
        data={zones}
        isLoading={isLoading}
        emptyMessage="No delivery zones found. Click '+ Add New Zone' to add pincode coverage."
      />

      {/* Add Zone Modal */}
      <Modal
        isOpen={isAddZoneOpen}
        onClose={() => setIsAddZoneOpen(false)}
        title="Add New Delivery Zone"
      >
        <ZoneForm
          onSubmit={handleCreateZone}
          onCancel={() => setIsAddZoneOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Zone Modal */}
      <Modal
        isOpen={!!editingZone}
        onClose={() => setEditingZone(null)}
        title={`Edit Zone: ${editingZone?.pincode}`}
      >
        {editingZone && (
          <ZoneForm
            initialData={editingZone}
            isEditing
            onSubmit={handleUpdateZone}
            onCancel={() => setEditingZone(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>
    </div>
  )
}

export default AdminZonesPage

