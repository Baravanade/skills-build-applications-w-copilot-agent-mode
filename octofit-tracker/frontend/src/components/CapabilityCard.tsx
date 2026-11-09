import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  collection: string;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
};

type RequestState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: T[] };

export function CapabilityCard<T>({ title, description, path, collection, emptyText, renderItem }: Props<T>) {
  const [state, setState] = useState<RequestState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getJson<Record<string, T[]>>(path).then((response) => {
      if (!Array.isArray(response?.[collection])) throw new Error('Invalid API response');
      if (active) setState({ status: 'success', items: response[collection] });
    }).catch(() => {
      if (active) setState({ status: 'error' });
    });
    return () => { active = false; };
  }, [path, collection]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
    {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}.</p>}
    {state.status === 'success' && (state.items.length === 0
      ? <p>{emptyText}</p>
      : <ul>{state.items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>)}
  </div></section>;
}
