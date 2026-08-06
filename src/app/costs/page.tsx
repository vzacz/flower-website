'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Trash2, Wallet } from 'lucide-react';
import { Cost, Customer } from '@/types';
import { createCost, deleteCost, listCosts } from '@/app/actions/costs';
import { listCustomers } from '@/app/actions/customers';

const money = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// The date input wants YYYY-MM-DD in the local timezone. toISOString() would
// convert to UTC first, which hands back yesterday for most of the evening.
function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDate(date: string): string {
  // Parsed as parts, not as a string: `new Date('2026-08-05')` is treated as
  // UTC midnight and displays as the day before west of Greenwich.
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// The order they're written on paper. All amount leads and is typed like the
// rest — it is not worked out from the four after it.
const BASE_FIELDS = [
  { name: 'allAmount', label: 'All amount' },
  { name: 'cargoAmount', label: 'Cargo amount' },
  { name: 'goodsCost', label: 'Goods cost' },
  { name: 'airlineFee', label: 'Airline fee' },
  { name: 'brokerFee', label: 'Broker' },
] as const;

// Filled in from the five above as they're typed, and typeable all the same:
// once one of these is touched it keeps whatever was put in it.
const DERIVED_FIELDS = [
  { name: 'finalAmount', label: 'Final amount', tone: 'emerald' },
  { name: 'haveToPay', label: 'Have to pay', tone: 'red' },
] as const;

type MoneyField =
  | (typeof BASE_FIELDS)[number]['name']
  | (typeof DERIVED_FIELDS)[number]['name'];

const EMPTY_AMOUNTS: Record<MoneyField, string> = {
  allAmount: '',
  cargoAmount: '',
  goodsCost: '',
  airlineFee: '',
  brokerFee: '',
  finalAmount: '',
  haveToPay: '',
};

// Every box on the form wears the same outline; the two worked-out ones are
// tinted so they read as the answers rather than more things to fill in.
const TONES = {
  plain: 'border-slate-600/80 text-white focus:border-emerald-400',
  emerald: 'border-emerald-700 text-emerald-400 focus:border-emerald-400',
  red: 'border-red-700 text-red-400 focus:border-red-400',
} as const;

// Defined out here, not inside the page: a component declared during render is
// a new type on every keystroke, and React would remount the input and drop
// the cursor mid-number.
function MoneyBox({
  name,
  label,
  tone,
  value,
  onValueChange,
}: {
  name: string;
  label: string;
  tone: keyof typeof TONES;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          $
        </span>
        <input
          id={name}
          name={name}
          type="number"
          step="0.01"
          inputMode="text"
          placeholder="0.00"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className={`w-full rounded-xl border bg-slate-950 py-2.5 pl-8 pr-4 text-lg font-semibold placeholder-slate-600 shadow-inner transition-colors focus:outline-none ${TONES[tone]}`}
        />
      </div>
    </div>
  );
}

export default function CostsPage() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [date, setDate] = useState(today());
  const [amounts, setAmounts] = useState<Record<MoneyField, string>>(EMPTY_AMOUNTS);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const refresh = async () => setCosts(await listCosts());

  useEffect(() => {
    // Stores only: a load is split between shops on the round, not between the
    // people bought from one at a time.
    Promise.all([listCosts(), listCustomers('store')])
      .then(([loadedCosts, loadedCustomers]) => {
        setCosts(loadedCosts);
        setCustomers(loadedCustomers);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load your costs.')
      )
      .finally(() => setLoaded(true));
  }, []);

  // The stores and date are left as they were on purpose: costs tend to be
  // entered a few at a time for the same load, and retyping the same date on
  // every one is how wrong dates get saved.
  const handleSubmit = (formData: FormData) => {
    setFormError(null);
    setError(null);

    startSaving(async () => {
      const result = await createCost(formData);

      if (result.error) {
        setFormError(result.error);
        return;
      }

      setAmounts(EMPTY_AMOUNTS);
      // The next cost starts working itself out again from scratch.
      typedOver.current.clear();
      await refresh().catch(() => {});
    });
  };

  /**
   * Keeps the final amount and have-to-pay in step with the five boxes above
   * them, until one of them is typed in — after that the typed figure stands,
   * and the arithmetic stops overwriting it.
   *
   * Held in a ref rather than state because it is only ever read inside this
   * handler; as state it would be one render stale exactly when it matters.
   */
  const typedOver = useRef<Set<MoneyField>>(new Set());

  const handleAmountChange = (field: MoneyField, value: string) => {
    if (field === 'finalAmount' || field === 'haveToPay') typedOver.current.add(field);

    setAmounts((current) => {
      const next = { ...current, [field]: value };

      // Half-typed entries like "-" aren't numbers yet, and count as nothing
      // rather than breaking the sum.
      const amountOf = (name: MoneyField): number => {
        const parsed = Number(next[name]);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      // Nothing entered yet means nothing to show — an eager "$0.00" in the
      // answers would look like a figure rather than an empty box.
      const started = BASE_FIELDS.some((base) => next[base.name].trim() !== '');
      const asText = (amount: number) => (started ? String(Math.round(amount * 100) / 100) : '');

      const final = BASE_FIELDS.reduce((sum, base) => sum + amountOf(base.name), 0);
      if (!typedOver.current.has('finalAmount')) next.finalAmount = asText(final);

      // Follows whichever final amount is actually showing, so correcting the
      // final by hand carries through to what has to be paid.
      const shownFinal = typedOver.current.has('finalAmount') ? amountOf('finalAmount') : final;
      if (!typedOver.current.has('haveToPay')) {
        next.haveToPay = asText(amountOf('allAmount') - shownFinal);
      }

      return next;
    });
  };

  // The figures across rows: what the loads came to, and what has to be paid
  // back out for them.
  const allTime = costs.reduce((sum, cost) => sum + cost.finalAmount, 0);
  const owed = costs.reduce((sum, cost) => sum + cost.haveToPay, 0);
  const thisMonth = useMemo(() => {
    const prefix = today().slice(0, 7);
    return costs
      .filter((cost) => cost.date.startsWith(prefix))
      .reduce((sum, cost) => sum + cost.finalAmount, 0);
  }, [costs]);

  const handleDelete = (cost: Cost) => {
    if (
      !window.confirm(
        `Delete the ${money(cost.finalAmount)} cost for ${cost.storeNames.join(', ')} on ${formatDate(cost.date)}? This cannot be undone.`
      )
    ) {
      return;
    }

    setError(null);
    startBusy(async () => {
      const result = await deleteCost(cost.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      await refresh().catch(() => {});
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Costs</h1>
          <p className="mt-1 text-slate-400">What each load cost you to bring in</p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">All final amounts</p>
            <p className="mt-2 text-3xl font-bold text-white">{money(allTime)}</p>
          </div>
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-6">
            <p className="text-sm text-red-400">Have to pay</p>
            <p className="mt-2 text-3xl font-bold text-red-400">{money(owed)}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">This month</p>
            <p className="mt-2 text-3xl font-bold text-white">{money(thisMonth)}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Entries</p>
            <p className="mt-2 text-3xl font-bold text-white">{costs.length}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-xl font-bold text-white">Add a cost</h2>
          <p className="mt-1 text-sm text-slate-400">
            Leave anything you didn&apos;t pay blank — a blank counts as zero. Put a minus in
            front of an amount that came back to you, like −80.
          </p>

          <form action={handleSubmit} className="mt-6 space-y-4">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-slate-300">
                Stores <span className="text-slate-500">(tick every one this load is for)</span>
              </legend>

              {customers.length === 0 ? (
                <p className="text-sm text-slate-400">Loading your stores...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {customers.map((customer) => {
                    const picked = storeIds.includes(customer.id);
                    return (
                      <label
                        key={customer.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-inner transition-colors ${
                          picked
                            ? 'border-emerald-500 bg-emerald-600/20 font-semibold text-white'
                            : 'border-slate-600/80 bg-slate-950 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="storeIds"
                          value={customer.id}
                          checked={picked}
                          onChange={(event) =>
                            setStoreIds((current) =>
                              event.target.checked
                                ? [...current, customer.id]
                                : current.filter((id) => id !== customer.id)
                            )
                          }
                          className="h-4 w-4 accent-emerald-500"
                        />
                        {customer.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <div className="sm:max-w-xs">
              <label htmlFor="date" className="mb-2 block text-sm font-medium text-slate-300">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-slate-600/80 bg-slate-950 px-4 py-2.5 font-semibold text-white shadow-inner transition-colors focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {BASE_FIELDS.map((field) => (
                <MoneyBox
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  tone="plain"
                  value={amounts[field.name]}
                  onValueChange={(value) => handleAmountChange(field.name, value)}
                />
              ))}
            </div>

            <div className="border-t border-slate-700/70 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
                {DERIVED_FIELDS.map((field) => (
                  <MoneyBox
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    tone={field.tone}
                    value={amounts[field.name]}
                    onValueChange={(value) => handleAmountChange(field.name, value)}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                These two fill themselves in from the boxes above. Type in either one and yours is
                kept.
              </p>
            </div>

            {formError && (
              <p className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                {formError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-4 border-t border-slate-700 pt-4">
              <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : 'Add cost'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-6 text-xl font-bold text-white">Everything you&apos;ve paid out</h2>

          {!loaded ? (
            <p className="py-8 text-center text-slate-400">Loading...</p>
          ) : costs.length === 0 ? (
            <div className="py-10 text-center">
              <Wallet size={32} className="mx-auto text-slate-600" />
              <p className="mt-3 text-slate-400">
                No costs written down yet. Add your first one above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-3 py-3 text-left text-sm font-medium text-slate-300">Date</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-slate-300">Store</th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-slate-300">
                      All amount
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-slate-300">Cargo</th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-slate-300">Goods</th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-slate-300">
                      Airline
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-slate-300">
                      Broker
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-slate-300">
                      Final amount
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-red-400">
                      Have to pay
                    </th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {costs.map((cost) => (
                    <tr key={cost.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-3 py-3 text-slate-300">
                        {formatDate(cost.date)}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-white">{cost.storeNames.join(', ')}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-slate-300">
                        {money(cost.allAmount)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300">
                        {money(cost.cargoAmount)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300">{money(cost.goodsCost)}</td>
                      <td className="px-3 py-3 text-right text-slate-300">{money(cost.airlineFee)}</td>
                      <td className="px-3 py-3 text-right text-slate-300">{money(cost.brokerFee)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-white">
                        {money(cost.finalAmount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-red-400">
                        {money(cost.haveToPay)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => handleDelete(cost)}
                          disabled={busy}
                          title="Delete this cost"
                          className="rounded p-2 text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-60"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={7} className="px-3 py-3 text-right text-sm text-slate-400">
                      Totals
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-lg font-bold text-emerald-400">
                      {money(allTime)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-lg font-bold text-red-400">
                      {money(owed)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
