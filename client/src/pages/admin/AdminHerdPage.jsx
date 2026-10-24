import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  createAdminCattle,
  getAdminCattle,
  updateAdminCattle,
} from '../../api/adminApi.js'
import { getHerdStats } from '../../api/herdApi.js'
import CattleForm from '../../components/admin/CattleForm.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Modal from '../../components/common/Modal.jsx'
import HerdStatCard from '../../components/herd/HerdStatCard.jsx'

export function AdminHerdPage() {
  const [cattleList, setCattleList] = useState([])
  const [herdStats, setHerdStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [isAddCattleOpen, setIsAddCattleOpen] = useState(false)
  const [editingCattle, setEditingCattle] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [cattleRes, statsRes] = await Promise.all([
        getAdminCattle(),
        getHerdStats(),
      ])
      setCattleList(cattleRes.cattle || [])
      setHerdStats(statsRes)
    } catch (err) {
      setError(err.message || 'Failed to load herd records')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleCreateCattle(payload) {
    try {
      setIsSubmitting(true)
      await createAdminCattle(payload)
      toast.success('Animal registered to herd!')
      setIsAddCattleOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Could not register animal')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateCattle(payload) {
    if (!editingCattle) return
    try {
      setIsSubmitting(true)
      await updateAdminCattle(editingCattle.id, payload)
      toast.success('Cattle record updated!')
      setEditingCattle(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Could not update cattle record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    {
      header: 'Tag ID',
      render: (animal) => (
        <span className="font-mono font-bold text-espresso text-sm">
          {animal.tagId}
        </span>
      ),
    },
    {
      header: 'Type',
      render: (animal) => {
        const typeBadge = {
          COW: 'bg-sand-light text-espresso border-sand/40',
          BULL: 'bg-amber-50 text-amber-900 border-amber-200',
          CALF: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        }
        return (
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              typeBadge[animal.type] || 'bg-stone-100 text-stone-800'
            }`}
          >
            {animal.type}
          </span>
        )
      },
    },
    {
      header: 'Breed',
      render: (animal) => (
        <span className="font-semibold text-espresso">{animal.breed}</span>
      ),
    },
    {
      header: 'Category (Cows)',
      render: (animal) => (
        <span className="text-xs text-espresso/70">
          {animal.category || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (animal) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            animal.isActive
              ? 'bg-forest-light text-forest border border-forest/30'
              : 'bg-stone-100 text-stone-600 border border-stone-300'
          }`}
        >
          {animal.isActive ? 'Active in Care' : 'Retired'}
        </span>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (animal) => (
        <button
          type="button"
          onClick={() => setEditingCattle(animal)}
          className="text-xs font-semibold text-terracotta hover:underline"
        >
          Edit Record
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
            Livestock Stewardship
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso">
            Herd Registry & Care
          </h1>
          <p className="mt-1 text-xs text-espresso/60">
            Real-time tracking of indigenous cows, gentle bulls, and calves
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddCattleOpen(true)}
          className="self-start sm:self-auto"
        >
          + Register New Animal
        </Button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* Live Stats Strip on Top */}
      {herdStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <HerdStatCard
            label="Total Cattle"
            number={herdStats.total}
            subtitle="Full registered herd"
            icon="🏷️"
          />
          <HerdStatCard
            label="Cows"
            number={herdStats.cows}
            subtitle="Female herd"
            icon="🐄"
          />
          <HerdStatCard
            label="Milking Cows"
            number={herdStats.milkingCows ?? herdStats.byCategory?.MILKING}
            subtitle="Active lactation"
            icon="🥛"
          />
          <HerdStatCard
            label="Bulls"
            number={herdStats.bulls}
            subtitle="Gentle sires"
            icon="🐂"
          />
          <HerdStatCard
            label="Calves"
            number={herdStats.calves}
            subtitle="Protected young"
            icon="🌱"
          />
        </div>
      )}

      {/* Cattle Table */}
      <DataTable
        columns={columns}
        data={cattleList}
        isLoading={isLoading}
        emptyMessage="No animals registered in the herd yet."
      />

      {/* Register Animal Modal */}
      <Modal
        isOpen={isAddCattleOpen}
        onClose={() => setIsAddCattleOpen(false)}
        title="Register New Cattle"
      >
        <CattleForm
          onSubmit={handleCreateCattle}
          onCancel={() => setIsAddCattleOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Animal Modal */}
      <Modal
        isOpen={!!editingCattle}
        onClose={() => setEditingCattle(null)}
        title={`Edit Record: ${editingCattle?.tagId}`}
      >
        {editingCattle && (
          <CattleForm
            initialData={editingCattle}
            isEditing
            onSubmit={handleUpdateCattle}
            onCancel={() => setEditingCattle(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>
    </div>
  )
}

export default AdminHerdPage

