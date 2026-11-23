(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Parallax: same maths as app/(site)/hero-parallax.tsx.
  const hero = document.querySelector('.hero-parallax');
  if (hero && !reduced) {
    let frame = 0;
    const pointer = { x: 0, y: 0 };
    const apply = () => {
      frame = 0;
      const sy = Math.min(scrollY, innerHeight);
      hero.style.setProperty('--sy', String(sy));
      hero.style.setProperty('--mx', String(pointer.x));
      hero.style.setProperty('--my', String(pointer.y));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('pointermove', (e) => {
      pointer.x = e.clientX / innerWidth - .5;
      pointer.y = e.clientY / innerHeight - .5;
      schedule();
    }, { passive: true });
    apply();
  }

  // Static demo marker.
  const note = document.createElement('div');
  note.className = 'demo-note';
  note.textContent = 'Static demo · read-only';
  document.body.appendChild(note);

  let toast;
  const flash = (msg) => {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'demo-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  // Search and ray filters on the members page.
  const isMembers = location.pathname.endsWith('members.html');
  const searchForm = document.querySelector('form input[name="q"]')?.closest('form');
  const cards = isMembers
    ? [...document.querySelectorAll('a[href^="member-"]')].filter((a) => a.querySelector('h2'))
    : [];

  const filter = () => {
    if (!cards.length) return;
    const q = (searchForm?.querySelector('input[name="q"]')?.value || '').trim().toLowerCase();
    const ray = new URLSearchParams(location.search).get('ray') || '';
    const wanted = ray ? ({"music":"Music","craftsmanship":"Craftsmanship","graphics":"Graphics","lore":"Lore & Writing","the-fifth-ray":"The Fifth Ray","alchemy":"Alchemy","community":"Community"}[ray] || '') : '';
    let shown = 0;
    for (const card of cards) {
      const text = card.textContent.toLowerCase();
      const keep = (!q || text.includes(q)) && (!wanted || text.includes(wanted.toLowerCase()));
      card.style.display = keep ? '' : 'none';
      if (keep) shown++;
    }
    let empty = document.querySelector('.demo-empty');
    if (!shown) {
      if (!empty) {
        empty = document.createElement('p');
        empty.className = 'demo-empty py-20 text-center text-sm text-bone/55';
        empty.textContent = 'No one by that description in this snapshot.';
        cards[0].parentElement.parentElement.appendChild(empty);
      }
      empty.style.display = '';
    } else if (empty) {
      empty.style.display = 'none';
    }
  };

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => e.preventDefault());
    searchForm.querySelector('input[name="q"]').addEventListener('input', filter);
    filter();
  } else if (isMembers) {
    filter();
  }

  // Everything else that needs a server.
  for (const form of document.forms) {
    if (form === searchForm) continue;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      flash('Accounts and posting are disabled in this static demo');
    });
  }

  for (const link of document.querySelectorAll('a[href*="events.html?month="]')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      flash('The static demo shows the current month');
    });
  }

  // The login page needs a plain explanation, not two dead forms.
  if (location.pathname.endsWith('login.html')) {
    const main = document.querySelector('main');
    if (main) {
      const banner = document.createElement('div');
      banner.className = 'demo-banner';
      banner.innerHTML = '<strong>This is a static demo.</strong> Sign-in, registration and posting are disabled. The live community runs on Discord — use the invite on the home page.';
      main.prepend(banner);
    }
  }

  // Live Discord counts from the public invite endpoint. CORS is allowed;
  // no token, no server. Cached per tab so a reload does not hit the API.
  const INVITE_CODE = 'RVGaaUUjy';
  const discordSection = document.querySelector('#discord');
  const discordGrid = discordSection?.querySelector('.relative.grid');
  if (discordGrid) {
    const card = document.createElement('div');
    card.className = 'demo-discord-stats';
    card.innerHTML =
      '<p class="eyebrow !text-[9px] text-ice/70">In the room</p>' +
      '<p class="demo-discord-name">Order of the Seven Rays</p>' +
      '<div class="demo-discord-numbers">' +
        '<div><span class="demo-discord-number" data-discord="members">—</span><span class="demo-discord-label">Members</span></div>' +
        '<div><span class="demo-discord-number" data-discord="online">—</span><span class="demo-discord-label">Online now</span></div>' +
      '</div>' +
      '<p class="demo-discord-live"><span class="demo-discord-dot"></span><span data-discord="status">Reading live counts…</span></p>';
    discordGrid.appendChild(card);

    const membersEl = card.querySelector('[data-discord="members"]');
    const onlineEl = card.querySelector('[data-discord="online"]');
    const statusEl = card.querySelector('[data-discord="status"]');
    const nameEl = card.querySelector('.demo-discord-name');

    const paint = (payload) => {
      if (payload.name) nameEl.textContent = payload.name;
      membersEl.textContent = payload.members == null ? '—' : String(payload.members);
      onlineEl.textContent = payload.online == null ? '—' : String(payload.online);
      statusEl.textContent = 'Live from Discord';
      card.classList.add('is-live');
    };

    const cacheKey = 'order7:discord:' + INVITE_CODE;
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch (e) {}

    if (cached && Date.now() - cached.at < 120000) {
      paint(cached.payload);
    } else {
      fetch('https://discord.com/api/v10/invites/' + INVITE_CODE + '?with_counts=true&with_expiration=true', {
        headers: { accept: 'application/json' },
      })
        .then((res) => {
          if (!res.ok) throw new Error('invite stats ' + res.status);
          return res.json();
        })
        .then((data) => {
          const payload = {
            name: data.guild && data.guild.name,
            members: data.approximate_member_count ?? (data.profile && data.profile.member_count) ?? null,
            online: data.approximate_presence_count ?? (data.profile && data.profile.online_count) ?? null,
          };
          paint(payload);
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), payload })); } catch (e) {}
        })
        .catch(() => {
          statusEl.textContent = 'Live counts unavailable';
        });
    }
  }
})();
