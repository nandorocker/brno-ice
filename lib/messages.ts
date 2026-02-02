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

export function getMessagePool(status: StatusKind, lang: Lang, reason?: string, seasonOverride?: SeasonKey | "auto") {
  const noData = {
    cs: ["Ehm, měla by tu být data,\nale nejsou. Zkus to za chvíli znovu? 😅"],
    en: ["Hmm, there should be data here, but there isn't. Try again in a bit? 😅"],
  } as const;

  const unknownThickness = {
    cs: ["Nejsme si jistí —\ndata jsou neúplná.\nZkus to později? 🤷"],
    en: ["Not sure —\ndata is incomplete.\nCheck back later? 🤷"],
  } as const;

  if (reason === "no_data") {
    return noData[lang];
  }
  if (reason === "unknown_thickness") {
    return unknownThickness[lang];
  }

  const messages = {
    ready: {
      cs: [
        "Jasně že jo!\nLed drží 🎉",
        "Ano. Hurá na Prygl - led je připravený ⛸️",
        "Brusle v ruce a vyraz z Bystrce -\nled dobrý! ✨",
        "Jo, od Přístaviště až ke Kozí Horce to drží ❄️",
        "Bezva podmínky -\nfrčíme na led! 🧊",
        "Ale jó!\nJe to tam jako beton ⛸️",
        "Led je ready,\ntak proč se ještě díváš na monitor?\nVypadni ven 😏",
        "No jasně.\nLed drží líp než Šalina na Rooseveltově ⛸️",
      ],
      en: [
        "Hell yeah!\nThe ice is solid 🎉",
        "Yes.\nPerfect conditions - the ice is ready ⛸️",
        "Grab your skates and head out from Bystrc -\nice is good! ✨",
        "Yep, from Přístaviště all the way to Kozí Horka -it holds ❄️",
        "Great conditions -\nlet's go! 🧊",
        "Absolutely!\nIt's solid as concrete ⛸️",
        "Ice is ready,\nso why are you still staring at your screen?\nGet out there 😏",
        "Of course.\nIce holds better than the tram on Rooseveltova ⛸️",
      ],
    },
    not_ready: {
      cs: [
        "Ještě ne -\nled je moc tenký ✋",
        "Né.\nNechoď tam, není to bezpečný.\nRadši na Starobrno do Sokoláku ⚠️",
        "Led je slabý,\npočkej na pořádný mráz ✋",
        "Zatím ne -\npotřebuje to ještě pár dní mrazu 🧊",
        "Nestojí to za to,\nled není dost tlustý ⚠️",
        "Zůstaň doma,\nna Pryglu to ještě nedrží ✋",
        "Ne.\nA ne, nejsi výjimka.\nProstě počkej 🙄",
        "Led slabší než wifi na Hlaváku.\nTo nechceš 📵",
      ],
      en: [
        "Not yet -\nthe ice is too thin ✋",
        "Nope.\nDon't go - it's not safe.\nBetter grab a Starobrno at Sokol instead ⚠️",
        "Ice is weak,\nwait for a proper freeze ✋",
        "Not yet -\nneeds a few more cold days 🧊",
        "Not worth the risk -\nice isn't thick enough ⚠️",
        "Stay home -\nthe Prygl won't hold yet ✋",
        "Nope.\nYou're gonna have to wait... 🙄",
        "Ice weaker than wifi at the main station.\nYou don't want that 📵",
      ],
    },
    caution: {
      cs: [
        "Možná, ale pozor - \nled je na hraně\nbezpečnosti 👀",
        "Technicky jo,\nale buď opatrný.\nLed drží jen místy 👀",
        "Na vlastní nebezpečí.\nPodmínky jsou na hraně 👀",
      ],
      en: [
        "Maybe,\nbut careful - the ice is borderline safe 👀",
        "Technically yes,\nbut be careful.\nIce holds only in places 👀",
        "At your own risk.\nConditions are borderline 👀",
      ],
    },
    no_data: {
      cs: "Ehm, měla by tu být data, ale nejsou. Zkus to za chvíli znovu? 😅",
      en: "Uh oh, there should be data here but there isn't. Try again in a bit? 😅",
    },
    off_season: {
      cs: {
        spring: [
          "Led je pryč, jaro je tady.\nVrať se až budeš vidět dech. 🌸",
        ],
        summer: [
          "Vždyť jediný led co tu je,\nje v tvým ledovým Starobrnu. ☀️",
        ],
        autumn: [
          "Padá listí, ne sníh.\nVracej se až bude pořádně zima,\nnejdřív v prosinci 🍂",
        ],
      },
      en: {
        spring: [
          "The ice is gone, spring is here.\nCome back when you can see your breath. 🌸",
        ],
        summer: [
          "The only ice on the Prygl right now is from your icy Starobrno, vole. ☀️",
        ],
        autumn: [
          "Leaves are falling, not snow.\nCome back in actual winter! 🍂",
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

  return pool;
}

export function pickMessage(status: StatusKind, lang: Lang, reason?: string, seasonOverride?: SeasonKey | "auto") {
  const pool = getMessagePool(status, lang, reason, seasonOverride);
  if (!pool.length) return "";
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
