export default function Badge({ status }) {
  const map = { paid:'bg-green-100 text-green-700', unpaid:'bg-red-100 text-red-700', partial:'bg-yellow-100 text-yellow-700', active:'bg-blue-100 text-blue-700', completed:'bg-green-100 text-green-700', overdue:'bg-red-100 text-red-700', deposit:'bg-green-100 text-green-700', withdrawal:'bg-red-100 text-red-700', given:'bg-blue-100 text-blue-700', taken:'bg-orange-100 text-orange-700' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
}
