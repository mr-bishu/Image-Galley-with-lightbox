// Simple lightbox + upload handler
(function(){
  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbCaption = document.getElementById('lbCaption');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const fileInput = document.getElementById('fileInput');
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  const menuClose = document.getElementById('menuClose');
  const menuCategories = document.getElementById('menuCategories');
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const signinBtn = document.getElementById('signinBtn');
  const signoutBtn = document.getElementById('signoutBtn');
  const filteredContainer = document.getElementById('filteredContainer');

  let images = []; // flat list of all images across categories
  let currentIndex = 0;
  let targetCategory = null; // category where next upload will go

  function rebuildIndex(){
    images = [];
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    items.forEach((a,i)=>{
      a.dataset.index = String(i);
      const img = a.querySelector('img');
      images.push({src: img.src, alt: img.alt || ''});
    });
  }

  function openLightbox(index){
    if(images.length === 0) return;
    currentIndex = (index + images.length) % images.length;
    lbImage.src = images[currentIndex].src;
    lbImage.alt = images[currentIndex].alt || '';
    lbCaption.textContent = images[currentIndex].alt || '';
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.setAttribute('aria-hidden','true');
    lbImage.src = '';
    document.body.style.overflow = '';
  }

  function showNext(){ openLightbox(currentIndex + 1); }
  function showPrev(){ openLightbox(currentIndex - 1); }

  // initial
  document.addEventListener('DOMContentLoaded', ()=>{
    rebuildIndex();
    // attach click handlers to all upload buttons
    document.querySelectorAll('.upload-btn').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        targetCategory = btn.dataset.category;
        fileInput.click();
      });
    });

    // build menu entries
    buildMenu();

    // auth UI
    if(signinBtn) signinBtn.addEventListener('click', ()=> location.href = '/signin.html');
    if(signoutBtn) signoutBtn.addEventListener('click', ()=>{ localStorage.removeItem('token'); updateAuthUI(); });
    updateAuthUI();

    // search behavior
    if(searchBtn && searchInput){
      searchBtn.addEventListener('click', ()=>{
        const showing = searchInput.style.display !== 'none';
        searchInput.style.display = showing ? 'none' : 'inline-block';
        if(!showing) searchInput.focus(); else { searchInput.value=''; showAll(); }
      });
      searchInput.addEventListener('keydown', (ev)=>{
        if(ev.key === 'Enter') performSearch(searchInput.value.trim());
        if(ev.key === 'Escape'){ searchInput.value=''; searchInput.style.display='none'; showAll(); }
      });
    }
  });

  // Delegate gallery clicks (works across categories)
  document.addEventListener('click', (e)=>{
    const anchor = e.target.closest('.gallery-item');
    if(!anchor) return;
    e.preventDefault();
    const idx = parseInt(anchor.dataset.index,10);
    if(!Number.isNaN(idx)) openLightbox(idx);
  });

  // Lightbox controls
  lbClose.addEventListener('click', closeLightbox);
  lbNext.addEventListener('click', showNext);
  lbPrev.addEventListener('click', showPrev);

  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e)=>{
    if(lightbox.getAttribute('aria-hidden') === 'false'){
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowRight') showNext();
      if(e.key === 'ArrowLeft') showPrev();
    }
  });

  // Upload handling: append to category gallery
  fileInput.addEventListener('change', (e)=>{
    const files = Array.from(e.target.files || []);
    if(!targetCategory){ fileInput.value = ''; return; }
    const gallery = document.querySelector('.gallery[data-category="' + targetCategory + '"]');
    files.forEach(file=>{
      if(!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev)=>{
        const a = document.createElement('a');
        a.className = 'gallery-item';
        a.href = '#';
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.alt = file.name;
        a.appendChild(img);
        gallery.appendChild(a);
        rebuildIndex();
        observeGalleryItems();
        buildMenu();
      };
      reader.readAsDataURL(file);
    });
    // reset
    targetCategory = null;
    fileInput.value = '';
  });

  // Menu controls (animated open/close)
  menuBtn.addEventListener('click', ()=>{
    menu.setAttribute('aria-hidden','false');
    menu.classList.add('open');
    menuBtn.setAttribute('aria-expanded','true');
  });
  menuClose.addEventListener('click', ()=>{
    menu.setAttribute('aria-hidden','true');
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
  });

  function buildMenu(){
    // categories
    menuCategories.innerHTML = '';
    document.querySelectorAll('.category').forEach(sec=>{
      const cat = sec.dataset.category;
      const name = cat.charAt(0).toUpperCase() + cat.slice(1);
      const li = document.createElement('div');
      li.className = 'menu-item';
      const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px';
      const icon = document.createElement('span'); icon.textContent = getCategoryEmoji(cat); icon.style.fontSize='18px';
      const label = document.createElement('span'); label.textContent = name;
      left.appendChild(icon); left.appendChild(label);
      const count = sec.querySelectorAll('.gallery-item').length;
      const right = document.createElement('div'); right.className='cat-badge'; right.textContent = count;
      li.appendChild(left); li.appendChild(right);
      li.addEventListener('click', ()=>{ filterByCategory(cat); menu.setAttribute('aria-hidden','true'); menuBtn.setAttribute('aria-expanded','false'); });
      menuCategories.appendChild(li);
    });
    // update auth display in menu header
    const header = document.createElement('div'); header.className='menu-header'; header.innerHTML = '<div><div class="menu-title">Gallery Menu</div><div class="menu-sub">Browse categories</div></div>';
    menu.insertBefore(header, menu.querySelector('.menu-list'));
  }

  function getCategoryEmoji(cat){
    const map = {food:'🍔',selfies:'🤳',beauty:'💄',nature:'🌲',city:'🏙️'};
    return map[cat] || '🖼️';
  }

  // Create category action
  const createCategoryAction = document.querySelector('[data-action="create-category"]');
  if(createCategoryAction){
    createCategoryAction.addEventListener('click', ()=>{
      const name = prompt('New category name');
      if(!name) return;
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-');
      // ensure uniqueness
      if(document.querySelector('.category[data-category="'+slug+'"]')){
        alert('Category already exists');
        return;
      }
      const sec = document.createElement('section');
      sec.className = 'category';
      sec.dataset.category = slug;
      const header = document.createElement('div'); header.className = 'category-header';
      const h2 = document.createElement('h2'); h2.textContent = name;
      const btn = document.createElement('button'); btn.className='upload-btn'; btn.dataset.category = slug; btn.setAttribute('aria-label','Upload to '+name); btn.innerHTML = '<span class="plus">+</span>';
      header.appendChild(h2); header.appendChild(btn);
      const gallery = document.createElement('div'); gallery.className='gallery'; gallery.dataset.category = slug;
      sec.appendChild(header); sec.appendChild(gallery);
      document.querySelector('.categories').appendChild(sec);
      // wire upload handler for new button
      btn.addEventListener('click', ()=>{
        targetCategory = btn.dataset.category;
        fileInput.click();
      });
      buildMenu();
    });
  }

  // Create Defaults action
  // Create Defaults action removed (menu action removed in markup)

  function showAll(){
    // show all categories and clear filtered view
    document.querySelectorAll('.category').forEach(c=> c.style.display = 'block');
    filteredContainer.style.display = 'none';
    filteredContainer.innerHTML = '';
    document.body.classList.remove('filtered');
  }

  function filterByCategory(cat){
    document.querySelectorAll('.category').forEach(c=>{
      if(c.dataset.category === cat) c.style.display = 'block'; else c.style.display = 'none';
    });
    filteredContainer.style.display = 'none';
    document.body.classList.remove('filtered');
  }

  function performSearch(query){
    if(!query){ showAll(); return; }
    // first try to match category names
    const catMatch = Array.from(document.querySelectorAll('.category')).map(c=>({key:c.dataset.category,label:c.querySelector('h2')?.textContent||c.dataset.category})).find(c=> c.label.toLowerCase() === query.toLowerCase() || c.key.toLowerCase() === query.toLowerCase());
    if(catMatch){ filterByCategory(catMatch.key); menu.setAttribute('aria-hidden','true'); menuBtn.setAttribute('aria-expanded','false'); return; }

    const matches = Array.from(document.querySelectorAll('.gallery-item')).filter(a=>{
      const img = a.querySelector('img');
      const text = (img.alt || '') + ' ' + (img.src || '');
      return text.toLowerCase().includes(query.toLowerCase());
    });
    filteredContainer.innerHTML = '';
    matches.forEach(a=>{ const clone = a.cloneNode(true); clone.dataset.index = ''; filteredContainer.appendChild(clone); });
    document.querySelectorAll('.category').forEach(c=> c.style.display = 'none');
    filteredContainer.style.display = matches.length ? 'grid' : 'block';
    document.body.classList.add('filtered');
    rebuildIndex();
  }

  // menu: All action
  const allAction = document.querySelector('[data-action="all"]');
  if(allAction) allAction.addEventListener('click', ()=>{ showAll(); menu.setAttribute('aria-hidden','true'); menuBtn.setAttribute('aria-expanded','false'); });
  
  // auth helpers
  async function updateAuthUI(){
    const token = localStorage.getItem('token');
    const signin = document.getElementById('signinBtn');
    const signout = document.getElementById('signoutBtn');
    if(!token){ if(signin) signin.style.display='inline-block'; if(signout) signout.style.display='none'; return; }
    try{
      const res = await fetch('/api/me',{headers:{'Authorization':'Bearer '+token}});
      if(!res.ok) throw new Error('unauth');
      const data = await res.json();
      if(signin) signin.style.display='none';
      if(signout) signout.style.display='inline-block';
      // show username in menu header if present
      const menuTitle = menu.querySelector('.menu-title');
      if(menuTitle) menuTitle.textContent = 'Hello, '+ (data.user.name || data.user.email);
    }catch(e){ localStorage.removeItem('token'); if(signin) signin.style.display='inline-block'; if(signout) signout.style.display='none'; }
  }

  // Scroll / reveal animations for gallery items
  let galleryObserver = null;
  function observeGalleryItems(){
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    if(galleryObserver) galleryObserver.disconnect();
    galleryObserver = new IntersectionObserver((entries)=>{
      entries.forEach(ent=>{
        if(ent.isIntersecting){ ent.target.classList.add('in-view'); }
      });
    },{root:null,rootMargin:'0px 0px -10% 0px',threshold:0.12});
    items.forEach(it=> galleryObserver.observe(it));
  }

  // ensure items get observed after initial build
  document.addEventListener('DOMContentLoaded', ()=>{ observeGalleryItems(); });

})();
