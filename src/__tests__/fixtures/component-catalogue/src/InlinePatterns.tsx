import type {JSX} from 'react'

export function InlinePatterns(): JSX.Element {
  const tone = 'accent'
  return (
    <section>
      <button className="btn btn-primary">One</button>
      <button className="btn btn-secondary">Two</button>
      <button className={`btn btn-${tone}`}>Dynamic</button>
      <input className="input input-bordered" />
      <select className="select select-bordered" />
      <article className="card bg-base-100">One</article>
      <article className="card bg-base-200">Two</article>
      <span className="badge badge-info">One</span>
      <span className="badge badge-warning">Two</span>
      <nav className="menu"><a>One</a></nav>
      <div className="dropdown"><button>Two</button></div>
      <dialog className="modal">One</dialog>
      <div className="modal modal-open">Two</div>
      <aside className="drawer">One</aside>
      <aside className="drawer drawer-open">Two</aside>
    </section>
  )
}
