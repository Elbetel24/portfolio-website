const api = (path, opts = {}) => fetch('/api' + path, opts).then(r => r.json());

function setToken(t){ if(t) localStorage.setItem('token', t); else localStorage.removeItem('token'); }
function authHeaders(){ const t = localStorage.getItem('token'); return t? { 'Authorization': 'Bearer '+t, 'Content-Type':'application/json' } : { 'Content-Type':'application/json' }; }

document.getElementById('btn-signup').onclick = async () => {
  const name = document.getElementById('su-name').value;
  const email = document.getElementById('su-email').value;
  const pass = document.getElementById('su-pass').value;
  const res = await api('/auth/signup', { method:'POST', body: JSON.stringify({ name, email, password: pass }), headers: { 'Content-Type':'application/json' } });
  if (res.token) { setToken(res.token); showApp(); loadExpenses(); }
};

document.getElementById('btn-login').onclick = async () => {
  const email = document.getElementById('li-email').value;
  const pass = document.getElementById('li-pass').value;
  const res = await api('/auth/login', { method:'POST', body: JSON.stringify({ email, password: pass }), headers: { 'Content-Type':'application/json' } });
  if (res.token) { setToken(res.token); showApp(); loadExpenses(); }
};

document.getElementById('btn-logout').onclick = () => { setToken(null); showAuth(); };

function showAuth(){ document.getElementById('auth').style.display='flex'; document.getElementById('app').style.display='none'; }
function showApp(){ document.getElementById('auth').style.display='none'; document.getElementById('app').style.display='block'; }

if (localStorage.getItem('token')) { showApp(); loadExpenses(); } else showAuth();

document.getElementById('expense-form').onsubmit = async (e) =>{
  e.preventDefault();
  const title = document.getElementById('title').value;
  const amount = Number(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value || new Date().toISOString();
  await api('/expenses', { method:'POST', body: JSON.stringify({ title, amount, category, date }), headers: authHeaders() });
  document.getElementById('expense-form').reset();
  loadExpenses();
};

document.getElementById('btn-refresh').onclick = loadExpenses;

async function loadExpenses(){
  try{
    const q = new URLSearchParams();
    const search = document.getElementById('search').value;
    const category = document.getElementById('filter-category').value;
    if (search) q.set('search', search);
    if (category) q.set('category', category);
    const res = await fetch('/api/expenses?'+q.toString(), { headers: authHeaders() }).then(r=>r.json());
    const list = document.getElementById('expenses'); list.innerHTML='';
    (res.items||[]).forEach(it =>{
      const li = document.createElement('li');
      li.innerHTML = `<div>${it.title} — ${it.category} — $${it.amount.toFixed(2)}</div><div><button data-id='${it._id}' class='del'>Del</button></div>`;
      list.appendChild(li);
    });
    document.querySelectorAll('.del').forEach(b=>b.onclick=async e=>{ const id=e.target.dataset.id; await fetch('/api/expenses/'+id,{ method:'DELETE', headers: authHeaders() }); loadExpenses(); });
    loadSummary();
  }catch(err){ console.error(err); }
}

async function loadSummary(){
  try{
    const data = await fetch('/api/expenses/summary/monthly', { headers: authHeaders() }).then(r=>r.json());
    const labels = data.map(d=>d.category);
    const values = data.map(d=>d.total);
    const ctx = document.getElementById('summaryChart').getContext('2d');
    if (window._chart) window._chart.destroy();
    window._chart = new Chart(ctx, { type:'pie', data: { labels, datasets:[{ data: values, backgroundColor: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f'] }] } });
  }catch(err){ console.error(err); }
}
