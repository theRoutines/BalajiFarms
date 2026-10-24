import Loader from '../common/Loader.jsx'

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found',
  keyAccessor = 'id',
}) {
  function getRowKey(row, index) {
    if (typeof keyAccessor === 'function') return keyAccessor(row, index)
    return row[keyAccessor] ?? index
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-husk bg-white p-12">
        <Loader size="md" text="Loading records..." />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-husk bg-white p-12 text-center text-espresso/60 text-sm">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-husk bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-husk bg-cream/70 text-xs font-semibold uppercase tracking-wider text-espresso/70">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-husk/50 text-espresso">
            {data.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className="hover:bg-cream/40 transition duration-150"
              >
                {columns.map((col, colIndex) => {
                  let cellContent = null
                  if (col.render) {
                    cellContent = col.render(row, rowIndex)
                  } else if (col.accessor) {
                    cellContent = row[col.accessor]
                  }

                  return (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 align-middle ${col.className || ''}`}
                    >
                      {cellContent}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable

