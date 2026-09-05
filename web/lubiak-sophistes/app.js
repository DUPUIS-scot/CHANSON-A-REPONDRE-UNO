const pages = [
  {
    label: "Couverture",
    folio: "",
    cover: true,
    html: `
      <img src="assets/banquet-stage.png" alt="Le banquet royal représenté sur une scène de théâtre; Jojo joue du violon devant la famille royale.">
      <div class="cover-title">
        <h2>Le banquet des sophistes</h2>
        <p>Texte français original · lecture animée</p>
      </div>
      <div class="cover-credit">LUBIAK</div>`
  },
  {
    label: "Page 25", folio: "25",
    html: `
      <div class="folio-head"><strong>Lubiak</strong><span>Le banquet des sophistes</span><span>25</span></div>
      <div class="page-text">
        <h2>LE BANQUET DES SOPHISTES</h2>
        <h3>I</h3>
        <p class="stage">Juin 2058. Palais royal de Katmandu. Le brouhaha des klaxons surnageait le déroulement de ce qui deviendra le carnage qui a fait mouche. La salle à dîner reçoit, le soir en question, la famille royale et trois invités, revenu de Lhassa à dos de serpentins cosmiques. Le troisième, jouant le domestique, apporte du canard confit avec des groseilles de petits bonhommes bleus, mais la copine a le mal des hauteurs. La salle est immense et décorée d’artefacts qui doivent avoir dans les mille et une nuits.</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>À moins que, il faut dire adieu au toit<br><span class="bracket">[ du monde</span><br>c’est une vraie glacière insonorisée,<br>le trou de bal de l’homélie comique.</p>
        <p class="speech"><span class="speaker">La Reine :</span><br>De la fricassée ?</p>
        <p class="stage">Elle passe le plat.</p>
        <p class="speech">Mon jeune lama, cette nuit sera funeste,<br>mais nous sommes si heureux, le roi et moi,<br>au Potala, de vous avoir béatifié,<br>car à l’arrivée du Prince, sale narquois,<br>vous prendrez les balles, bouclier mitraille.</p>
      </div><span class="folio-number">25</span>`
  },
  {
    label: "Page 26", folio: "26",
    html: `
      <div class="folio-head"><strong>Lubiak</strong><span>Le banquet des sophistes</span><span>26</span></div>
      <div class="page-text">
        <p class="speech"><span class="speaker">Le Roi :</span><br>N’ayez crainte de cette royale infamie,<br>peut-être qu’un air au violon nous détendrait,<br>fiston, prions pour survivre au cruel Didi.</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>Tout un reel grivois et expérimental<br>avec un peu de Chardonnet !<br>C’est là vos deniers vœux, dragons bienveillants ?</p>
        <p class="stage">On apporte un Strad de 1721 dans un étui de velours :<br>Le Bonjour ! On tamise les lumières. Bouddha fait un<br>clin’ d’œil, au fil des années, une gigue pour le vrai<br>monde.</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>Alors, fa sol ré fa do mi, dièse diesel,<br>cauchemar cachère et verts antipsychotiques,<br>dragonneries dans l’œuf, hippie électronique,<br>cracheurs de flammes, la diaspora fait dans le zèle !</p>
        <p class="speech"><span class="speaker">Le Roi :</span><br>Voici la quinzième vie après la mort,<br><span class="bracket">[ Hail !</span></p>
        <p class="speech"><span class="speaker">La Reine :</span><br>Blabla, capitaines, l’ovation !<br>et publicités...<br>Ça tourne pour Bollywood, l’opium fait chanter.</p>
      </div><span class="folio-number">26</span>`
  },
  {
    label: "Page 27", folio: "27",
    html: `
      <div class="folio-head"><strong>Lubiak</strong><span>Le banquet des sophistes</span><span>27</span></div>
      <div class="page-text">
        <p class="continuation">Bibi, quelle chinoiserie spirituelle,<br>que le spasme sempiternel du kif, du riff !</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>Kirie eleison, tût, tût l’angélus...<br>alléluia, quel nécromancien que l’affreux orphelin<br>ô palais des cieux du centenaire pontife,<br>et Pax au dernier banquet pour qui n’a rit.</p>
        <h3>II</h3>
        <p class="stage">Entre le Prince Didi mitraillette maoïste en bandoulière.</p>
        <p class="speech"><span class="speaker">Le Prince :</span><br>Qui est cet hôte vindicatif et maniaque ?<br>Père, ne me dis pas que tu as convié ce pseudo magicien<br>que je mette en scène la mort de l’anglais macaque.</p>
        <p class="speech"><span class="speaker">Le Roi :</span> Dépouillé, va !</p>
        <p class="speech"><span class="speaker">Le Prince :</span> Détesté, oui !</p>
        <p class="speech"><span class="speaker">La Reine :</span> Poudre de riz !</p>
        <p class="speech"><span class="speaker">Le Prince :</span><br>Mère, je ne me marierai pas avec la<br>garce, elle me pue au nez. J’épouserai la fichtrement</p>
      </div><span class="folio-number">27</span>`
  },
  {
    label: "Page 28", folio: "28",
    html: `
      <div class="folio-head"><strong>Lubiak</strong><span>Le banquet des sophistes</span><span>28</span></div>
      <div class="page-text">
        <p class="continuation">sorcière, ça tombe bien, la voilà pour la cérémonie,<br>elle est mienne, que je farcirai ma comparse !</p>
        <p class="speech"><span class="speaker">La Reine :</span><br>Misérable bougre !<br>Tragédie de cégépien !<br>N’arrivant pas à la cheville de son mari,<br>quitte donc ce fier banquet avant la tuerie !</p>
        <p class="speech"><span class="speaker">Le Roi :</span> Écoute ta mère.</p>
        <p class="speech"><span class="speaker">Le Prince :</span><br>C’est lui, hein ? Cet avorton ?<br>Ce bourlingueur écœurant ?<br>Vous lui donnez ma place, non ? Folle sagesse !</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>Didi, nos visas expireront demain,<br>Sagarmatha, déesse de glace, bénis<br>notre union. Tu ne peux rien y changer, nenni !</p>
        <p class="speech"><span class="speaker">Le Prince :</span> Tu penses ça ?</p>
        <p class="speech"><span class="speaker">La Reine :</span><br>Fils, noble et royal est l’hymen,<br>Je m’oppose à ce que tu touches à la sorcière.</p>
        <p class="speech"><span class="speaker">Le Prince :</span><br>Soit ! Que commence le carnage qui a<br><span class="bracket">[ fait mouche !</span></p>
      </div><span class="folio-number">28</span>`
  },
  {
    label: "Page 29", folio: "29",
    html: `
      <div class="folio-head"><strong>Lubiak</strong><span>Le banquet des sophistes</span><span>29</span></div>
      <div class="page-text">
        <p class="stage">Sa petitesse dégaine et flingue dans le tas, blesse chacun des invités. C’est alors que Jojo, camusien à ses heures, se métamorphose en silmari’llion, bien qu’on l’aie déplumé devant le Potala. Il se cabre devant les invités, devant un peu tout le monde, le temps qu’ils se transforment en serpentins rougeoyants et quittent la salle où fuse le sang.<br>Comme en 1989, le tireur fou vide son arme, à l’exception d’une balle. La copine s’effondre. Le Roi et la Reine s’envolent au Tibet. Le troisième invité, balrog invalide, passe par l’hôpital, prendra la route de Saigon.</p>
        <h3>III</h3>
        <p class="speech"><span class="speaker">Le Prince :</span><br>Allez, viens, bats-toi, touche, coulé, j’ai<br><span class="bracket">[ fait mouche,</span><br>comme à l’École, soustraits aux parlementaires,<br>tu as l’arme de Dorje en sillimanite,<br>fais vite ou elle crèvera sans faux-semblant,<br>et je boirai ton sang en Transnitrie. Fais vite !</p>
        <p class="stage">Le Prince sort un sabre et s’amusera avec autant qu’un maître d’armes.</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>Ta cervelle, pète-toi-la tout seul, tyran !</p>
      </div><span class="folio-number">29</span>`
  },
  {
    label: "Page 30", folio: "30",
    html: `
      <div class="folio-head"><strong>Lubiak</strong><span>Le banquet des sophistes</span><span>30</span></div>
      <div class="page-text">
        <p class="speech"><span class="speaker">Le Prince :</span><br>T’as les jetons, vermine sioniste ?</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>J’t’emmerde !</p>
        <p class="stage">Le silmari’llion redevient donc petit homme et sort de sa poche un objet gros comme ça.</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>Ép Gno Me Dep Éna Mua ! (Aum Ané<br>Ped Me Ong à l’envers, tsé.)</p>
        <p class="stage">Et l’objet gros comme ça prend des allures de cossin incroyable.</p>
        <p class="speech"><span class="speaker">Le Prince :</span><br>Ha ! ha ! Dadaïste !</p>
        <p class="stage">Pour avoir la peau d’un bédéiste, quand la copine top graphique quitte l’Orient dans l’obscurité, il faut être plus qu’un champion sur un balai. Cet objet gros comme ça, nul escrimeur ne saurait le défier. En résumé, c’est fatras, foudres et flammes. L’Empereur et le fonctionnaire se battent pendant une bonne demi-heure dans des ténèbres opaques. Le dernier voit son arme brisée en deux et s’effondre sur le sol, vaincu.</p>
      </div><span class="folio-number">30</span>`
  },
  {
    label: "Page 31", folio: "31",
    html: `
      <div class="folio-head"><strong>Lubiak</strong><span>Le banquet des sophistes</span><span>31</span></div>
      <div class="page-text">
        <p class="speech"><span class="speaker">Le Prince :</span><br>Vas-tu m’achever <em>(Il sort sa langue de nigaud.)</em> m’achever !</p>
        <p class="speech"><span class="speaker">Jojo :</span><br>À quoi bon, rejoint tes parents, dis-je,<br><span class="bracket">[ victoire !</span></p>
        <p class="speech"><span class="speaker">Le Prince :</span><br>Non, je te parle d’honneur. Adieu à la<br><span class="bracket">[ foire !</span></p>
        <p class="speech"><span class="speaker">Jojo :</span><br>Je ne te retiens pas. La virée est achevée.</p>
        <p class="stage">Jojo n’a pas fermé les yeux comme à Polytechnique. Il s’est manqué ! Scaramouche qui a fait mouche prend la direction de l’hôpital et aucun média ici-bas ne saurait dire s’il vit toujours. La matalda est sérieusement éclopée, mais un nécromancien a toujours de la vie à revendre. Il faudra réinventer cette science. Parce qu’il y en a marre. Parce que ce n’est parce qu’on rend la vie, qu’elle nous rend nécessairement un peu d’amour. Mais bon, sur le truc en sillimanite, direction Freak Street. Le lendemain, l’héroïne d’une petite vie toute simple a repris la direction de la Saint-Denis.</p>
      </div><span class="folio-number">31</span>`
  }
];

const pageContent = document.getElementById("pageContent");
const paper = document.getElementById("paper");
const book = document.getElementById("book");
const stage = document.getElementById("bookStage");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const prevEdge = document.getElementById("prevEdge");
const nextEdge = document.getElementById("nextEdge");
const slider = document.getElementById("pageSlider");
const indicator = document.getElementById("pageIndicator");
const autoplayButton = document.getElementById("autoplay");
const zoomValue = document.getElementById("zoomValue");

let index = 0;
let zoom = 1;
let turning = false;
let autoplayTimer = null;
let pointerStart = null;

function pageMarkup(page) {
  return page.cover ? `<div class="cover-page">${page.html}</div>` : page.html;
}

function render(target = index) {
  const page = pages[target];
  pageContent.className = `page-content${page.cover ? " cover-page" : ""}`;
  pageContent.innerHTML = page.html;
  index = target;
  slider.value = String(index);
  indicator.textContent = `${page.label} · ${index + 1} / ${pages.length}`;
  prevButton.disabled = prevEdge.disabled = index === 0;
  nextButton.disabled = nextEdge.disabled = index === pages.length - 1;
  document.title = `${page.label} — Le banquet des sophistes`;
}

function goTo(target, animate = true) {
  target = Math.max(0, Math.min(pages.length - 1, target));
  if (target === index || turning) return;
  if (!animate || Math.abs(target - index) > 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    render(target);
    return;
  }

  turning = true;
  const direction = target > index ? "next" : "prev";
  const leaf = document.createElement("div");
  leaf.className = `turning-leaf ${direction}${pages[direction === "next" ? index : target].cover ? " cover-page" : ""}`;
  leaf.innerHTML = pages[direction === "next" ? index : target].html;

  if (direction === "next") render(target);
  paper.appendChild(leaf);
  if (direction === "prev") requestAnimationFrame(() => leaf.classList.add("animate"));

  leaf.addEventListener("animationend", () => {
    if (direction === "prev") render(target);
    leaf.remove();
    turning = false;
  }, { once: true });
}

function changeZoom(delta) {
  zoom = Math.max(.7, Math.min(2, Math.round((zoom + delta) * 10) / 10));
  document.documentElement.style.setProperty("--zoom", zoom);
  zoomValue.value = `${Math.round(zoom * 100)}%`;
  zoomValue.textContent = `${Math.round(zoom * 100)}%`;
  if (zoom > 1) stage.scrollTo({ left: (book.scrollWidth * zoom - stage.clientWidth) / 2, behavior: "smooth" });
}

function stopAutoplay() {
  clearInterval(autoplayTimer);
  autoplayTimer = null;
  autoplayButton.setAttribute("aria-pressed", "false");
  autoplayButton.querySelector(".play-mark").textContent = "▶";
}

function toggleAutoplay() {
  if (autoplayTimer) return stopAutoplay();
  if (index === pages.length - 1) render(0);
  autoplayButton.setAttribute("aria-pressed", "true");
  autoplayButton.querySelector(".play-mark").textContent = "Ⅱ";
  autoplayTimer = setInterval(() => {
    if (index >= pages.length - 1) return stopAutoplay();
    goTo(index + 1);
  }, 6500);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

prevButton.addEventListener("click", () => goTo(index - 1));
nextButton.addEventListener("click", () => goTo(index + 1));
prevEdge.addEventListener("click", () => goTo(index - 1));
nextEdge.addEventListener("click", () => goTo(index + 1));
slider.addEventListener("input", event => goTo(Number(event.target.value), false));
autoplayButton.addEventListener("click", toggleAutoplay);
document.getElementById("zoomOut").addEventListener("click", () => changeZoom(-.1));
document.getElementById("zoomIn").addEventListener("click", () => changeZoom(.1));
document.getElementById("fullscreen").addEventListener("click", toggleFullscreen);

paper.addEventListener("dblclick", () => changeZoom(zoom < 1.4 ? .4 : 1 - zoom));
paper.addEventListener("pointerdown", event => {
  pointerStart = { x: event.clientX, y: event.clientY, time: Date.now() };
  paper.setPointerCapture?.(event.pointerId);
});
paper.addEventListener("pointerup", event => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  const elapsed = Date.now() - pointerStart.time;
  pointerStart = null;
  if (elapsed < 700 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(index + (dx < 0 ? 1 : -1));
});

document.addEventListener("keydown", event => {
  if (event.key === "ArrowRight" || event.key === "PageDown") goTo(index + 1);
  else if (event.key === "ArrowLeft" || event.key === "PageUp") goTo(index - 1);
  else if (event.key === "+" || event.key === "=") changeZoom(.1);
  else if (event.key === "-") changeZoom(-.1);
  else if (event.key.toLowerCase() === "f") toggleFullscreen();
  else if (event.code === "Space" && event.target.tagName !== "BUTTON") {
    event.preventDefault();
    toggleAutoplay();
  }
});

document.addEventListener("fullscreenchange", () => {
  document.getElementById("fullscreen").textContent = document.fullscreenElement ? "Quitter" : "Plein écran";
});

document.addEventListener("visibilitychange", () => { if (document.hidden && autoplayTimer) stopAutoplay(); });

render(0);
