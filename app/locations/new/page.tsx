import Link from 'next/link'
import { createLocation } from '@/lib/actions'

export default function NewLocation() {
  return <div>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Add location</h1>
        <p className="text-sm text-gray-500 mt-1">Create rack, overflow, pathway, or floor locations.</p>
      </div>
      <Link className="btn" href="/locations">Back to locations</Link>
    </div>

    <form action={createLocation} className="card p-5 grid gap-4 max-w-2xl">
      <label className="text-sm font-medium">Location code<input className="input mt-1" name="code" placeholder="A16 / OV01 / PASS01 / FL01" required /></label>
      <label className="text-sm font-medium">Type<select className="input mt-1" name="type" defaultValue="RACK">
        <option value="RACK">RACK</option>
        <option value="OVERFLOW">OVERFLOW</option>
        <option value="PATHWAY">PATHWAY</option>
        <option value="FLOOR">FLOOR</option>
      </select></label>
      <label className="text-sm font-medium">Zone<input className="input mt-1" name="zone" placeholder="A / B / Receiving / Overflow" /></label>
      <label className="text-sm font-medium">Capacity<input className="input mt-1" name="capacity" type="number" min="1" placeholder="Optional quantity capacity" /></label>
      <label className="text-sm font-medium">Note<input className="input mt-1" name="note" placeholder="Optional note" /></label>
      <button className="btn w-fit">Create location</button>
    </form>
  </div>
}
