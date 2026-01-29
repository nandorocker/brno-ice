import type { StatusKind } from "@/lib/types";

type SeasonKey = "winter" | "spring" | "summer" | "autumn";

type Lang = "cs" | "en";

function getSeasonKey(): SeasonKey {
  const now = new Date();
  const month = now.getMonth() + 1;
  if (month >= 12 || month <= 3) return "winter";
  if (month >= 4 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  return "autumn";
}

export function pickMessage(status: StatusKind, lang: Lang) {
  const messages = {
    ready: {
      cs: [
        "Jdeme bruslit! Led je připraven ⛸️",
        "Perfektní podmínky – Prygl je zmrzlý! ❄️",
        "Skvělá zpráva! Bruslení je možné 🎉",
        "Led drží – vezmi brusle! ✨",
      ],
      en: [
        "Let’s go skating! The ice is ready ⛸️",
        "Perfect conditions — the reservoir is frozen solid! ❄️",
        "Good news! Skating is available 🎉",
        "The ice is ready — grab your skates! ✨",
      ],
    },
    not_ready: {
      cs: [
        "Dnes ne – led je příliš tenký ⚠️",
        "Pozor – led zatím není bezpečný ⚠️",
        "Ještě to není ono – led potřebuje čas ⏳",
        "Led je tenký – nechoď na něj! 🧊",
      ],
      en: [
        "Not today — the ice is too thin ⚠️",
        "Hold up — the ice isn’t safe yet ⚠️",
        "Not quite ready — the ice needs more time ⏳",
        "Too thin to skate — stay off the ice! 🧊",
      ],
    },
    off_season: {
      cs: {
        winter: [
          "Zima je tady, ale data chybí. Mrkni později! ❄️",
          "Sezóna běží, ale nemáme čerstvá data. Zkus to za chvíli. 🧊",
        ],
        spring: [
          "Jaro je tu! Led je pryč. Uvidíme se příští zimu. 🌸",
          "Oteplilo se – brusle nech doma. 🌱",
        ],
        summer: [
          "Léto – mysli na koupání, ne na bruslení. Zkus to v prosinci! 🏖️",
          "V Brně teď není žádný led, jen ve tvé lednici. Vrať se v zimě! ☀️",
        ],
        autumn: [
          "Podzimní listí padá, ale led ještě ne. Přijď, až bude zima! 🍂",
          "Ještě to není ono. Počkej na první mrazy. 🌦️",
        ],
      },
      en: {
        winter: [
          "It’s winter, but no fresh data yet. Check back soon! ❄️",
          "The season is on, but we don’t have updated data yet. 🧊",
        ],
        spring: [
          "Spring is here! The ice is long gone. See you next winter. 🌸",
          "Warmer days — leave the skates at home. 🌱",
        ],
        summer: [
          "It’s summer — think swimming, not skating. Check back in December! 🏖️",
          "No ice in Brno right now, only in your fridge. Come back in winter! ☀️",
        ],
        autumn: [
          "Autumn leaves are falling, but no ice yet. Come back when winter arrives! 🍂",
          "Not quite there yet. Wait for the first hard frosts. 🌦️",
        ],
      },
    },
  } as const;

  let pool: string[] = [];
  if (status === "off_season") {
    const season = getSeasonKey();
    pool = messages.off_season[lang][season] || [];
  } else {
    pool = messages[status][lang] || [];
  }

  if (!pool.length) return "";
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
