export type HairstyleCategory = "short" | "medium" | "long" | "bangs" | "curly" | "color" | "style";

export type HairstylePreset = {
  id: string;
  name: string;
  category: HairstyleCategory;
  description: string;
  prompt: string;
  tags: string[];
  difficulty: "natural" | "medium" | "bold";
  maintenance: "low" | "medium" | "high";
  previewEmoji?: string;
};

export const categoryLabels: Record<HairstyleCategory | "all", string> = {
  all: "全部",
  short: "短发",
  medium: "中长发",
  long: "长发",
  bangs: "刘海",
  curly: "卷发",
  color: "染发",
  style: "风格"
};

export const difficultyLabels: Record<HairstylePreset["difficulty"], string> = {
  natural: "自然",
  medium: "中等变化",
  bold: "大胆变化"
};

export const maintenanceLabels: Record<HairstylePreset["maintenance"], string> = {
  low: "低打理",
  medium: "中等打理",
  high: "高打理"
};

const baseEditInstruction =
  "请只修改头发区域，将人物头发替换为目标发型。必须保留人物脸型、五官、肤色、表情、衣服、背景、光照、拍摄角度和人物身份特征。发际线要自然，头发质感要真实。不要改变脸，不要过度美颜，不要改变背景。输出真实照片风格。";

const promptFor = (style: string) => `${baseEditInstruction} 目标发型：${style}。`;

export const hairstylePresets: HairstylePreset[] = [
  {
    id: "buzz-cut",
    name: "男士寸头",
    category: "short",
    description: "干净利落的超短发，突出五官轮廓。",
    prompt: promptFor("男士寸头，头发极短且均匀，边缘修剪清爽，整体干净利落"),
    tags: ["清爽", "利落", "低打理"],
    difficulty: "bold",
    maintenance: "low",
    previewEmoji: "✂️"
  },
  {
    id: "chestnut-cut",
    name: "栗子头",
    category: "short",
    description: "圆润蓬松的短发，风格温和亲近。",
    prompt: promptFor("栗子头，顶部圆润蓬松，两侧自然收短，整体柔和干净"),
    tags: ["减龄", "圆润", "日常"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🌰"
  },
  {
    id: "quiff",
    name: "飞机头",
    category: "short",
    description: "顶部向上定型，精神感和立体感更强。",
    prompt: promptFor("飞机头，前额头发向上向后定型，顶部有自然支撑和立体纹理"),
    tags: ["精神", "立体", "型男"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🚀"
  },
  {
    id: "korean-short",
    name: "韩系短发",
    category: "short",
    description: "自然蓬松的短发，轮廓柔和有氛围。",
    prompt: promptFor("韩系短发，自然蓬松，发尾轻薄，额前有柔和层次"),
    tags: ["韩系", "蓬松", "温柔"],
    difficulty: "natural",
    maintenance: "medium",
    previewEmoji: "✨"
  },
  {
    id: "japanese-short",
    name: "日系短发",
    category: "short",
    description: "轻盈碎发层次，带一点少年感。",
    prompt: promptFor("日系短发，轻盈碎发层次，发尾自然外散，空气感明显"),
    tags: ["日系", "少年感", "轻盈"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🍃"
  },
  {
    id: "textured-bowl",
    name: "碎盖短发",
    category: "short",
    description: "保留盖发轮廓，同时加入碎发层次。",
    prompt: promptFor("碎盖短发，额前自然盖发，发尾打碎，两侧轻微收短"),
    tags: ["碎发", "盖发", "自然"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🧢"
  },
  {
    id: "textured-short",
    name: "纹理短发",
    category: "short",
    description: "顶部纹理明显，适合提升发量视觉。",
    prompt: promptFor("纹理短发，顶部有自然纹理和蓬松感，发束分明但不夸张"),
    tags: ["纹理", "蓬松", "日常"],
    difficulty: "natural",
    maintenance: "medium",
    previewEmoji: "〰️"
  },
  {
    id: "side-part-short",
    name: "侧分短发",
    category: "short",
    description: "经典侧分线条，兼顾正式和日常。",
    prompt: promptFor("侧分短发，清晰自然的侧分线，顶部顺滑，两侧修整干净"),
    tags: ["侧分", "通勤", "经典"],
    difficulty: "natural",
    maintenance: "medium",
    previewEmoji: "📐"
  },
  {
    id: "slick-back",
    name: "背头",
    category: "short",
    description: "头发向后梳理，成熟利落。",
    prompt: promptFor("背头，额前头发向后梳理，发丝顺滑有光泽，整体成熟利落"),
    tags: ["成熟", "利落", "正式"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🕴️"
  },
  {
    id: "american-crop-spikes",
    name: "美式前刺",
    category: "short",
    description: "短发前刺造型，清爽又有力量感。",
    prompt: promptFor("美式前刺，顶部短发向前上方竖起，发束自然分明，两侧干净"),
    tags: ["前刺", "硬朗", "清爽"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "⚡"
  },
  {
    id: "short-wolf-tail",
    name: "狼尾短发",
    category: "short",
    description: "短发结合轻狼尾，个性但不夸张。",
    prompt: promptFor("狼尾短发，前侧保持短发层次，后颈保留自然狼尾长度"),
    tags: ["狼尾", "层次", "个性"],
    difficulty: "bold",
    maintenance: "medium",
    previewEmoji: "🌙"
  },
  {
    id: "mullet",
    name: "鲻鱼头",
    category: "short",
    description: "前短后长的复古个性发型。",
    prompt: promptFor("鲻鱼头，前侧较短，后侧较长，层次自然衔接，复古个性"),
    tags: ["复古", "个性", "前短后长"],
    difficulty: "bold",
    maintenance: "medium",
    previewEmoji: "🎸"
  },
  {
    id: "korean-middle-part",
    name: "韩系中分",
    category: "medium",
    description: "中分轮廓柔和，适合营造氛围感。",
    prompt: promptFor("韩系中分，中长发自然中分，发根蓬松，发尾轻微内扣"),
    tags: ["韩系", "中分", "氛围感"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🪞"
  },
  {
    id: "three-seven-part",
    name: "三七分",
    category: "medium",
    description: "自然分区比例，修饰脸部线条。",
    prompt: promptFor("三七分中长发，分线自然，顶部蓬松，两侧发丝顺着脸型"),
    tags: ["三七分", "修饰", "通勤"],
    difficulty: "natural",
    maintenance: "medium",
    previewEmoji: "7️⃣"
  },
  {
    id: "four-six-part",
    name: "四六分",
    category: "medium",
    description: "分线更柔和，日常感强。",
    prompt: promptFor("四六分中长发，分线柔和不死板，发丝自然垂落"),
    tags: ["四六分", "自然", "柔和"],
    difficulty: "natural",
    maintenance: "medium",
    previewEmoji: "6️⃣"
  },
  {
    id: "natural-medium",
    name: "自然中长发",
    category: "medium",
    description: "不过分造型的中长发，真实耐看。",
    prompt: promptFor("自然中长发，长度到下巴至肩部之间，发丝自然蓬松垂落"),
    tags: ["自然", "耐看", "日常"],
    difficulty: "natural",
    maintenance: "low",
    previewEmoji: "🌿"
  },
  {
    id: "layered-medium",
    name: "层次中长发",
    category: "medium",
    description: "用层次提升轻盈感和头型立体度。",
    prompt: promptFor("层次中长发，有明显但自然的长短层次，发尾轻盈修饰脸型"),
    tags: ["层次", "轻盈", "修饰"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "📚"
  },
  {
    id: "wolf-cut",
    name: "狼尾发型",
    category: "medium",
    description: "顶部蓬松、后部延长，带时髦个性。",
    prompt: promptFor("狼尾发型，顶部有层次蓬松感，后颈发尾延长，整体自然时髦"),
    tags: ["狼尾", "时髦", "层次"],
    difficulty: "bold",
    maintenance: "medium",
    previewEmoji: "🌙"
  },
  {
    id: "mullet-wolf",
    name: "鲻鱼狼尾",
    category: "medium",
    description: "融合鲻鱼头和狼尾，个性更强。",
    prompt: promptFor("鲻鱼狼尾，前侧短层次结合后颈狼尾，发尾有自然流动感"),
    tags: ["鲻鱼", "狼尾", "个性"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🎤"
  },
  {
    id: "lazy-soft-wave",
    name: "慵懒微卷",
    category: "medium",
    description: "轻微卷度让发型更松弛自然。",
    prompt: promptFor("慵懒微卷中长发，发丝有轻微自然弯曲，蓬松松弛不凌乱"),
    tags: ["微卷", "松弛", "自然"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "☁️"
  },
  {
    id: "collarbone-hair",
    name: "锁骨发",
    category: "medium",
    description: "长度落在锁骨附近，利落又温柔。",
    prompt: promptFor("锁骨发，头发长度到锁骨附近，发尾自然内扣或微弯"),
    tags: ["锁骨发", "温柔", "利落"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "💎"
  },
  {
    id: "hime-cut",
    name: "公主切",
    category: "medium",
    description: "脸侧整齐切线，视觉风格鲜明。",
    prompt: promptFor("公主切，脸侧有整齐垂直切线，后发保持中长发，整体精致"),
    tags: ["公主切", "精致", "风格"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "👑"
  },
  {
    id: "air-bangs",
    name: "空气刘海",
    category: "bangs",
    description: "轻薄透气的刘海，温柔减龄。",
    prompt: promptFor("空气刘海，额前刘海轻薄透气，发丝自然分散不过厚"),
    tags: ["轻薄", "减龄", "温柔"],
    difficulty: "natural",
    maintenance: "medium",
    previewEmoji: "🫧"
  },
  {
    id: "french-bangs",
    name: "法式刘海",
    category: "bangs",
    description: "随性又有层次的刘海，适合氛围感造型。",
    prompt: promptFor("法式刘海，额前刘海自然松散，两侧连接脸侧层次"),
    tags: ["法式", "随性", "氛围感"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🥐"
  },
  {
    id: "curtain-bangs",
    name: "八字刘海",
    category: "bangs",
    description: "向两侧打开的刘海，修饰颧骨和脸型。",
    prompt: promptFor("八字刘海，额前刘海向两侧自然打开，脸侧弧度柔和"),
    tags: ["八字", "修饰", "自然"],
    difficulty: "natural",
    maintenance: "medium",
    previewEmoji: "〽️"
  },
  {
    id: "blunt-bangs",
    name: "齐刘海",
    category: "bangs",
    description: "整齐刘海线条，甜美干净。",
    prompt: promptFor("齐刘海，额前刘海整齐自然，厚度适中，发尾平顺"),
    tags: ["整齐", "甜美", "干净"],
    difficulty: "medium",
    maintenance: "high",
    previewEmoji: "▰"
  },
  {
    id: "manga-bangs",
    name: "漫画刘海",
    category: "bangs",
    description: "发束感明显，带二次元氛围。",
    prompt: promptFor("漫画刘海，刘海发束分明，线条清晰但仍保持真实照片质感"),
    tags: ["漫画感", "发束", "个性"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "📖"
  },
  {
    id: "side-swept-bangs",
    name: "侧分刘海",
    category: "bangs",
    description: "刘海向一侧自然梳开，轻松好驾驭。",
    prompt: promptFor("侧分刘海，刘海从一侧自然梳开，发尾顺着脸侧垂落"),
    tags: ["侧分", "轻松", "修饰"],
    difficulty: "natural",
    maintenance: "low",
    previewEmoji: "↘️"
  },
  {
    id: "baby-bangs",
    name: "眉上刘海",
    category: "bangs",
    description: "短刘海更有辨识度，风格大胆。",
    prompt: promptFor("眉上刘海，刘海长度在眉毛上方，边缘自然，风格利落"),
    tags: ["眉上", "个性", "短刘海"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🧷"
  },
  {
    id: "baby-hair-bangs",
    name: "胎毛刘海",
    category: "bangs",
    description: "脸周细碎发丝，柔化发际线。",
    prompt: promptFor("胎毛刘海，发际线周围有细碎自然的胎毛发丝，脸周柔和"),
    tags: ["胎毛", "柔和", "自然"],
    difficulty: "natural",
    maintenance: "low",
    previewEmoji: "🪶"
  },
  {
    id: "long-straight",
    name: "长直发",
    category: "long",
    description: "顺滑长直发，清爽耐看。",
    prompt: promptFor("长直发，头发顺直自然垂落，长度过肩，发丝有真实光泽"),
    tags: ["长发", "顺直", "耐看"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "📏"
  },
  {
    id: "black-long-straight",
    name: "黑长直",
    category: "long",
    description: "经典黑色长直发，干净高级。",
    prompt: promptFor("黑长直，深黑色长直发，发丝顺滑自然，整体干净高级"),
    tags: ["黑发", "长直", "高级"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🖤"
  },
  {
    id: "big-wave-long",
    name: "大波浪长发",
    category: "curly",
    description: "大弧度卷发，提升成熟氛围。",
    prompt: promptFor("大波浪长发，过肩长发带大弧度波浪卷，卷度自然蓬松"),
    tags: ["大波浪", "成熟", "氛围"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🌊"
  },
  {
    id: "wool-curls",
    name: "羊毛卷",
    category: "curly",
    description: "密集小卷，复古且发量感强。",
    prompt: promptFor("羊毛卷，密集自然小卷，发量感明显，整体复古蓬松"),
    tags: ["小卷", "复古", "蓬松"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🌀"
  },
  {
    id: "french-curls",
    name: "法式卷发",
    category: "curly",
    description: "随性柔软的卷度，自带慵懒感。",
    prompt: promptFor("法式卷发，卷度松散自然，发丝柔软，整体随性优雅"),
    tags: ["法式", "优雅", "松弛"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🥂"
  },
  {
    id: "water-wave-curls",
    name: "水波纹卷发",
    category: "curly",
    description: "纹理像水波一样连续柔和。",
    prompt: promptFor("水波纹卷发，连续柔和的波纹卷度，发丝纹理自然有光泽"),
    tags: ["水波纹", "柔和", "纹理"],
    difficulty: "medium",
    maintenance: "high",
    previewEmoji: "〰️"
  },
  {
    id: "high-layer-long",
    name: "高层次长发",
    category: "long",
    description: "高层次让长发更轻盈立体。",
    prompt: promptFor("高层次长发，长发加入高层次修剪，头顶和脸周更轻盈"),
    tags: ["高层次", "轻盈", "立体"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "⬆️"
  },
  {
    id: "low-layer-long",
    name: "低层次长发",
    category: "long",
    description: "保留发量和垂坠感，变化更自然。",
    prompt: promptFor("低层次长发，长发保留垂坠感，发尾有低层次自然过渡"),
    tags: ["低层次", "垂坠", "自然"],
    difficulty: "natural",
    maintenance: "low",
    previewEmoji: "⬇️"
  },
  {
    id: "dark-brown",
    name: "深棕色",
    category: "color",
    description: "自然显质感的深棕发色。",
    prompt: promptFor("深棕色发色，保持原发型轮廓基础上将头发调整为自然深棕色"),
    tags: ["深棕", "自然", "质感"],
    difficulty: "natural",
    maintenance: "low",
    previewEmoji: "🤎"
  },
  {
    id: "cool-brown",
    name: "冷棕色",
    category: "color",
    description: "偏冷调的棕色，干净不夸张。",
    prompt: promptFor("冷棕色发色，发丝呈自然冷调棕色，颜色均匀真实"),
    tags: ["冷棕", "干净", "日常"],
    difficulty: "natural",
    maintenance: "medium",
    previewEmoji: "🧊"
  },
  {
    id: "ash-flax-brown",
    name: "亚麻棕",
    category: "color",
    description: "轻盈亚麻棕，提升透明感。",
    prompt: promptFor("亚麻棕发色，棕色带柔和亚麻调，发丝有自然透明感"),
    tags: ["亚麻", "轻盈", "透明感"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🌾"
  },
  {
    id: "milk-tea-brown",
    name: "奶茶棕",
    category: "color",
    description: "温柔奶茶色调，显得柔和。",
    prompt: promptFor("奶茶棕发色，温柔浅棕奶茶调，颜色柔和不过曝"),
    tags: ["奶茶棕", "温柔", "浅棕"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🥛"
  },
  {
    id: "black-tea",
    name: "黑茶色",
    category: "color",
    description: "接近黑发但更有层次的茶色。",
    prompt: promptFor("黑茶色发色，接近自然黑发，带低调茶棕光泽和层次"),
    tags: ["黑茶", "低调", "显质感"],
    difficulty: "natural",
    maintenance: "low",
    previewEmoji: "🍵"
  },
  {
    id: "wine-red",
    name: "酒红色",
    category: "color",
    description: "偏红调发色，个性更明显。",
    prompt: promptFor("酒红色发色，深酒红调真实染发效果，发丝光泽自然"),
    tags: ["酒红", "个性", "显白"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🍷"
  },
  {
    id: "ash-brown",
    name: "灰棕色",
    category: "color",
    description: "灰感棕色，冷静高级。",
    prompt: promptFor("灰棕色发色，棕色中带自然灰调，整体冷静高级"),
    tags: ["灰棕", "冷调", "高级"],
    difficulty: "medium",
    maintenance: "high",
    previewEmoji: "🩶"
  },
  {
    id: "blue-black",
    name: "蓝黑色",
    category: "color",
    description: "低调黑发中带蓝色光泽。",
    prompt: promptFor("蓝黑色发色，整体接近黑色，在光线下有自然蓝色光泽"),
    tags: ["蓝黑", "低调", "冷感"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🌌"
  },
  {
    id: "light-blonde",
    name: "浅金色",
    category: "color",
    description: "明亮浅金发色，变化大胆。",
    prompt: promptFor("浅金色发色，真实染发质感，颜色明亮但不过曝，发丝细节清晰"),
    tags: ["浅金", "明亮", "大胆"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🏅"
  },
  {
    id: "highlights",
    name: "挑染",
    category: "color",
    description: "局部发束变色，增强层次。",
    prompt: promptFor("挑染，保持主体发色自然，加入少量真实局部挑染发束"),
    tags: ["挑染", "层次", "时髦"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🎨"
  },
  {
    id: "earloop-dye",
    name: "挂耳染",
    category: "color",
    description: "耳侧局部染色，低调有趣。",
    prompt: promptFor("挂耳染，在耳侧内层头发加入局部浅色或冷色染发，外层自然"),
    tags: ["挂耳染", "局部", "甜酷"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "👂"
  },
  {
    id: "ombre-dye",
    name: "渐变染",
    category: "color",
    description: "从发根到发尾自然渐变。",
    prompt: promptFor("渐变染，发根保持自然深色，向发尾渐变为较浅发色，过渡真实"),
    tags: ["渐变", "层次", "染发"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "🌈"
  },
  {
    id: "fresh-natural",
    name: "清爽自然",
    category: "style",
    description: "降低造型感，保留真实清爽状态。",
    prompt: promptFor("清爽自然风格，头发整理得干净自然，蓬松度适中，没有明显夸张造型"),
    tags: ["清爽", "自然", "日常"],
    difficulty: "natural",
    maintenance: "low",
    previewEmoji: "🌤️"
  },
  {
    id: "campus-style",
    name: "校园感",
    category: "style",
    description: "简单、干净、亲和的校园风。",
    prompt: promptFor("校园感发型，发丝干净柔和，造型自然亲和，整体清新"),
    tags: ["校园", "清新", "亲和"],
    difficulty: "natural",
    maintenance: "low",
    previewEmoji: "🎒"
  },
  {
    id: "korean-atmosphere",
    name: "韩系氛围感",
    category: "style",
    description: "强调蓬松轮廓和柔和发丝。",
    prompt: promptFor("韩系氛围感发型，顶部自然蓬松，脸周发丝柔和修饰，整体有空气感"),
    tags: ["韩系", "氛围", "蓬松"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "💫"
  },
  {
    id: "japanese-boyish",
    name: "日系少年感",
    category: "style",
    description: "轻盈碎发，少年感更明显。",
    prompt: promptFor("日系少年感发型，轻盈碎发层次，发尾自然，整体清爽灵动"),
    tags: ["日系", "少年感", "灵动"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🎐"
  },
  {
    id: "soft-mature",
    name: "轻熟风",
    category: "style",
    description: "自然精致，适合通勤和日常。",
    prompt: promptFor("轻熟风发型，发丝顺滑有层次，造型自然精致，成熟但不夸张"),
    tags: ["轻熟", "通勤", "精致"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "👜"
  },
  {
    id: "premium-style",
    name: "高级感",
    category: "style",
    description: "低调、顺滑、有质感的发型方向。",
    prompt: promptFor("高级感发型，发丝顺滑有真实光泽，线条干净，整体低调有质感"),
    tags: ["高级", "质感", "顺滑"],
    difficulty: "medium",
    maintenance: "high",
    previewEmoji: "💠"
  },
  {
    id: "sweet-cool",
    name: "甜酷风",
    category: "style",
    description: "柔和与个性并存，适合更醒目的造型。",
    prompt: promptFor("甜酷风发型，保留柔和脸周发丝，同时加入更有个性的层次或局部造型"),
    tags: ["甜酷", "个性", "时髦"],
    difficulty: "bold",
    maintenance: "medium",
    previewEmoji: "🧡"
  },
  {
    id: "hong-kong-style",
    name: "港风",
    category: "style",
    description: "复古蓬松，有胶片感的经典风格。",
    prompt: promptFor("港风发型，头发蓬松有自然弧度，发量感充足，复古真实照片质感"),
    tags: ["港风", "复古", "蓬松"],
    difficulty: "medium",
    maintenance: "medium",
    previewEmoji: "🎞️"
  },
  {
    id: "retro-style",
    name: "复古风",
    category: "style",
    description: "强调卷度或轮廓的复古造型。",
    prompt: promptFor("复古风发型，轮廓更饱满，发丝带自然弧度，整体有经典复古气质"),
    tags: ["复古", "经典", "轮廓"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "📻"
  },
  {
    id: "anime-inspired",
    name: "二次元感",
    category: "style",
    description: "发束更清晰，但保持真人照片质感。",
    prompt: promptFor("二次元感真人发型，发束线条更清晰，层次更明显，但必须保持真实照片风格"),
    tags: ["二次元", "发束", "风格化"],
    difficulty: "bold",
    maintenance: "high",
    previewEmoji: "⭐"
  }
];

export const hairstylePresetById = new Map(hairstylePresets.map((preset) => [preset.id, preset]));
