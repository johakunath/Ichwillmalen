/* ===========================================================================
   Ich will malen — shared picture gallery (picker)
   Replaces the per-mode copies of the picker. A mode page provides a small
   config and the engine callback; this module owns fetching the manifest,
   the optional Easy/Medium/Hard filter, grouping cards under theme headers,
   rendering thumbnails and wiring selection.

     Gallery.init({
       key:        "water" | "coloring" | "pixel" | "pbn",   // manifest array
       withLevels: true|false,        // show difficulty filter when present
       renderThumb: function(item, thumbEl){...},  // optional; default = <img>
       onPick:     function(item){...},            // load the chosen picture
       emptyMsg:   "...",             // shown when the mode has no pictures
       errorMsg:   "..."              // shown when the manifest can't load
     });
     Gallery.open();                  // re-open the gallery (bind to a button)
   =========================================================================== */
(function(){
  "use strict";

  var THEME_ORDER  = ["animals","vehicles","nature","everyday","seasonal","shapes"];
  var THEME_LABELS = {animals:"Animals",vehicles:"Vehicles",nature:"Nature",
                      everyday:"Everyday",seasonal:"Seasonal",shapes:"Shapes & fun",more:"More"};
  var LEVELS       = ["easy","medium","hard"];
  var LEVEL_LABELS = {all:"All",easy:"Easy",medium:"Medium",hard:"Hard"};

  var cfg=null, list=[], curLevel="all";
  var pick, grid, filterBar, closeBtn, msgEl;

  function byId(id){ return document.getElementById(id); }
  function elem(tag,cls){ var e=document.createElement(tag); if(cls) e.className=cls; return e; }
  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  function showMsg(t){ if(msgEl){ msgEl.textContent=t; msgEl.style.display="flex"; } }

  function open(){ if(pick) pick.style.display="flex"; }
  function close(){ if(pick) pick.style.display="none"; if(closeBtn) closeBtn.style.display=""; }

  function passesLevel(it){ return curLevel==="all" || it.level===curLevel; }

  function buildFilter(){
    if(!filterBar) return;
    filterBar.innerHTML="";
    var present={}; list.forEach(function(it){ if(it.level) present[it.level]=1; });
    var order=LEVELS.filter(function(l){ return present[l]; });
    if(!cfg.withLevels || !order.length){ filterBar.style.display="none"; return; }
    filterBar.style.display="flex";
    ["all"].concat(order).forEach(function(l){
      var c=elem("div","lvlchip"+(l===curLevel?" on":"")); c.textContent=LEVEL_LABELS[l];
      c.addEventListener("click",function(){ curLevel=l; buildFilter(); renderCards(); });
      filterBar.appendChild(c);
    });
  }

  function defaultThumb(item,thumbEl){
    var im=new Image(); im.src=item.file; im.alt=""; im.loading="lazy"; thumbEl.appendChild(im);
  }

  function makeCard(item){
    var c=elem("div","pcard");
    var th=elem("div","pthumb");
    (cfg.renderThumb || defaultThumb)(item,th);
    var nm=elem("div","pn"); nm.textContent=item.name;
    c.appendChild(th); c.appendChild(nm);
    c.addEventListener("click",function(){ close(); cfg.onPick(item); });
    return c;
  }

  function renderCards(){
    if(!grid) return;
    grid.innerHTML="";
    var items=list.filter(passesLevel);

    // group by theme, preserving a curated order then any extras
    var groups={}, seen=[];
    items.forEach(function(it){
      var th=it.theme||"more";
      if(!groups[th]){ groups[th]=[]; seen.push(th); }
      groups[th].push(it);
    });
    var ordered=THEME_ORDER.filter(function(t){ return groups[t]; })
      .concat(seen.filter(function(t){ return THEME_ORDER.indexOf(t)<0; }));

    var multi = ordered.length>1;
    ordered.forEach(function(th){
      if(multi){
        var h=elem("div","psection"); h.textContent=THEME_LABELS[th]||cap(th);
        grid.appendChild(h);
      }
      var sec=elem("div","pcards");
      groups[th].forEach(function(it){ sec.appendChild(makeCard(it)); });
      grid.appendChild(sec);
    });
  }

  function init(opts){
    cfg=opts;
    pick=byId("pick"); grid=byId("pickGrid"); filterBar=byId("pickFilter");
    closeBtn=byId("pickClose"); msgEl=byId("msg");
    if(closeBtn) closeBtn.addEventListener("click",function(){ if(pick) pick.style.display="none"; });

    fetch("templates/manifest.json").then(function(r){ return r.json(); }).then(function(m){
      list=(m && m[opts.key]) || [];
      if(!list.length){ showMsg(opts.emptyMsg||"No pictures yet."); return; }
      buildFilter();
      renderCards();
      open();                       // every mode starts on the picture-selection page
    }).catch(function(){
      showMsg(opts.errorMsg||"Open this from GitHub Pages (or a local server) so the pictures can load.");
    });
  }

  window.Gallery={ init:init, open:open };
})();
