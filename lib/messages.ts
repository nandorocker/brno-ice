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

export function pickMessage(status: StatusKind, lang: Lang, reason?: string, seasonOverride?: SeasonKey | "auto") {
  const noData = {
    cs: ["Ehm, měla by tu být data, ale nejsou. Zkus to za chvíli znovu? 😅"],
    en: ["Uh oh, there should be data here but there isn't. Try again in a bit? 😅"],
  } as const;

  if (reason === "no_data") {
    return noData[lang][0];
  }

  const messages = {
    ready: {
      cs: [
        "Jasně že jo! Led drží 🎉",
        "Ano. Hurá na Prygl - led je připravený ⛸️",
        "Brusle v ruce a vyraz z Bystrce - led dobrý! ✨",
        "Jo, od Přístaviště až ke Kozí Horce to drží ❄️",
        "Bezva podmínky - frčíme na led! 🧊",
        "Ale jó! Je to tam jako beton ⛸️",
        "Led je ready, tak proč se ještě díváš na monitor? Vypadni ven 😏",
        "No jasně. Led drží líp než Šalina na Rooseveltově ⛸️",
      ],
      en: [
        "Hell yeah! The ice is solid 🎉",
        "Yes. Perfect conditions - the ice is ready ⛸️",
        "Grab your skates and head out from Bystrc - ice is good! ✨",
        "Yep, from Přístaviště all the way to Kozí Horka ❄️",
        "Great conditions - let's go! 🧊",
        "Absolutely! It's solid as concrete ⛸️",
        "Ice is ready, so why are you still staring at your screen? Get out there 😏",
        "Of course. Ice holds better than the tram on Rooseveltova ⛸️",
      ],
    },
    not_ready: {
      cs: [
        "Ještě ne - led je moc tenký 🚫",
        "Né. Nechoď tam, není to bezpečný. Radši na Starobrno do Sokoláku ⚠️",
        "Led je slabý, počkej na pořádný mráz ❌",
        "Zatím ne - potřebuje to ještě pár dní mrazu 🧊",
        "Nestojí to za to, led není dost tlustý ⚠️",
        "Zůstaň doma, na Pryglu to ještě nedrží 🚫",
        "Ne. A ne, nejsi výjimka. Prostě počkej 🙄",
        "Led slabší než wifi na Hlaváku. To nechceš 📵",
      ],
      en: [
        "Not yet - the ice is too thin 🚫",
        "Nope. Don't go - it's not safe. Better grab a Starobrno at Sokol instead ⚠️",
        "Ice is weak, wait for a proper freeze ❌",
        "Not yet - needs a few more cold days 🧊",
        "Not worth the risk - ice isn't thick enough ⚠️",
        "Stay home - the Prygl won't hold yet 🚫",
        "No. And no, you're not the exception. Just wait 🙄",
        "Ice weaker than wifi at the main station. You don't want that 📵",
      ],
    },
    caution: {
      cs: [
        "Možná, ale pozor – led je na hraně bezpečnosti ⚠️",
        "Technicky jo, ale buď opatrný. Led drží jen místy ⚠️",
        "Na vlastní nebezpečí. Podmínky jsou na hraně ⚠️",
      ],
      en: [
        "Maybe, but careful — the ice is borderline safe ⚠️",
        "Technically yes, but be careful. Ice holds only in places ⚠️",
        "At your own risk. Conditions are borderline ⚠️",
      ],
    },
    no_data: {
      cs: "Ehm, měla by tu být data, ale nejsou. Zkus to za chvíli znovu? 😅",
      en: "Uh oh, there should be data here but there isn't. Try again in a bit? 😅",
    },
    off_season: {
      cs: {
        winter: [
          "Teď tady žádný led není. Skoč na zmrzku do Avion nebo počkej na zimu 🏖️",
        ],
        spring: [
          "Led je pryč, jaro je tady. Vrať se až budeš vidět dech. Tak třeba v listopadu 🌸",
        ],
        summer: [
          "Na Pryglu teď koupání, ne brusle. Led najdeš maximálně v pivě na Riviéře ☀️",
        ],
        autumn: [
          "Padá listí, ne sníh. Vracej se až bude pořádně zima, nejdřív v prosinci 🍂",
        ],
      },
      en: {
        winter: [
          "No ice here now. Grab an ice cream at Avion or wait for winter 🏖️",
        ],
        spring: [
          "The ice is gone, spring is here. Come back when you can see your breath. Maybe November 🌸",
        ],
        summer: [
          "Swimming at the Prygl now, not skating. Only ice is in your beer at Riviéra ☀️",
        ],
        autumn: [
          "Leaves are falling, not snow. Come back when it's properly cold, earliest in December 🍂",
        ],
      },
    },
  } as const;

  let pool: readonly string[] = [];
  if (status === "off_season") {
    const season = seasonOverride && seasonOverride !== "auto" ? seasonOverride : getSeasonKey();
    pool = messages.off_season[lang][season] || [];
  } else {
    pool = messages[status][lang] || [];
  }

  if (!pool.length) return "";
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
