/* currencies.js - country -> currency data + money formatting.
   Display names and symbols come from the browser's own Intl database,
   so we only ship the ISO-3166 (country) -> ISO-4217 (currency) mapping. */
(function (global) {
  'use strict';

  // "CC:CUR" pairs, comma separated. ~200 countries & territories.
  var MAP_RAW =
    'AD:EUR,AE:AED,AF:AFN,AG:XCD,AI:XCD,AL:ALL,AM:AMD,AO:AOA,AR:ARS,AS:USD,AT:EUR,AU:AUD,AW:AWG,AX:EUR,AZ:AZN,' +
    'BA:BAM,BB:BBD,BD:BDT,BE:EUR,BF:XOF,BG:BGN,BH:BHD,BI:BIF,BJ:XOF,BL:EUR,BM:BMD,BN:BND,BO:BOB,BQ:USD,BR:BRL,' +
    'BS:BSD,BT:BTN,BW:BWP,BY:BYN,BZ:BZD,CA:CAD,CC:AUD,CD:CDF,CF:XAF,CG:XAF,CH:CHF,CI:XOF,CK:NZD,CL:CLP,CM:XAF,' +
    'CN:CNY,CO:COP,CR:CRC,CU:CUP,CV:CVE,CW:ANG,CY:EUR,CZ:CZK,DE:EUR,DJ:DJF,DK:DKK,DM:XCD,DO:DOP,DZ:DZD,EC:USD,' +
    'EE:EUR,EG:EGP,EH:MAD,ER:ERN,ES:EUR,ET:ETB,FI:EUR,FJ:FJD,FK:FKP,FM:USD,FO:DKK,FR:EUR,GA:XAF,GB:GBP,GD:XCD,' +
    'GE:GEL,GF:EUR,GG:GBP,GH:GHS,GI:GIP,GL:DKK,GM:GMD,GN:GNF,GP:EUR,GQ:XAF,GR:EUR,GT:GTQ,GU:USD,GW:XOF,GY:GYD,' +
    'HK:HKD,HN:HNL,HR:EUR,HT:HTG,HU:HUF,ID:IDR,IE:EUR,IL:ILS,IM:GBP,IN:INR,IQ:IQD,IR:IRR,IS:ISK,IT:EUR,JE:GBP,' +
    'JM:JMD,JO:JOD,JP:JPY,KE:KES,KG:KGS,KH:KHR,KI:AUD,KM:KMF,KN:XCD,KP:KPW,KR:KRW,KW:KWD,KY:KYD,KZ:KZT,LA:LAK,' +
    'LB:LBP,LC:XCD,LI:CHF,LK:LKR,LR:LRD,LS:LSL,LT:EUR,LU:EUR,LV:EUR,LY:LYD,MA:MAD,MC:EUR,MD:MDL,ME:EUR,MF:EUR,' +
    'MG:MGA,MH:USD,MK:MKD,ML:XOF,MM:MMK,MN:MNT,MO:MOP,MP:USD,MQ:EUR,MR:MRU,MS:XCD,MT:EUR,MU:MUR,MV:MVR,MW:MWK,' +
    'MX:MXN,MY:MYR,MZ:MZN,NA:NAD,NC:XPF,NE:XOF,NF:AUD,NG:NGN,NI:NIO,NL:EUR,NO:NOK,NP:NPR,NR:AUD,NU:NZD,NZ:NZD,' +
    'OM:OMR,PA:PAB,PE:PEN,PF:XPF,PG:PGK,PH:PHP,PK:PKR,PL:PLN,PM:EUR,PN:NZD,PR:USD,PS:ILS,PT:EUR,PW:USD,PY:PYG,' +
    'QA:QAR,RE:EUR,RO:RON,RS:RSD,RU:RUB,RW:RWF,SA:SAR,SB:SBD,SC:SCR,SD:SDG,SE:SEK,SG:SGD,SH:SHP,SI:EUR,SJ:NOK,' +
    'SK:EUR,SL:SLE,SM:EUR,SN:XOF,SO:SOS,SR:SRD,SS:SSP,ST:STN,SV:USD,SX:ANG,SY:SYP,SZ:SZL,TC:USD,TD:XAF,TG:XOF,' +
    'TH:THB,TJ:TJS,TK:NZD,TL:USD,TM:TMT,TN:TND,TO:TOP,TR:TRY,TT:TTD,TV:AUD,TW:TWD,TZ:TZS,UA:UAH,UG:UGX,US:USD,' +
    'UY:UYU,UZ:UZS,VA:EUR,VC:XCD,VE:VES,VG:USD,VI:USD,VN:VND,VU:VUV,WF:XPF,WS:WST,YE:YER,YT:EUR,ZA:ZAR,ZM:ZMW,' +
    'ZW:ZWG';

  var COUNTRY_TO_CURRENCY = {};
  MAP_RAW.split(',').forEach(function (pair) {
    var p = pair.split(':');
    if (p.length === 2) COUNTRY_TO_CURRENCY[p[0]] = p[1];
  });

  // Language used for country and currency names in the UI.
  var displayLang = 'en';
  var dnCache = {};

  function displayName(type, code, fallback, lang) {
    var use = lang || displayLang;
    var key = use + '|' + type;
    try {
      if (!dnCache[key]) dnCache[key] = new Intl.DisplayNames([use, 'en'], { type: type });
      return dnCache[key].of(code) || fallback || code;
    } catch (e) {
      return fallback || code;
    }
  }

  /** Switch the language of country/currency names; clears the cached lists. */
  function setDisplayLang(lang) {
    if (lang === displayLang) return;
    displayLang = lang || 'en';
    countryList = null;
    extraList = null;
  }

  function flagOf(cc) {
    if (!/^[A-Z]{2}$/.test(cc)) return '';
    return String.fromCodePoint(0x1f1e6 + cc.charCodeAt(0) - 65) +
           String.fromCodePoint(0x1f1e6 + cc.charCodeAt(1) - 65);
  }

  // Narrow symbol for a currency code ("INR" -> the rupee sign). Falls back to the code.
  var symbolCache = {};
  function symbolOf(code) {
    if (symbolCache[code]) return symbolCache[code];
    var sym = code;
    ['narrowSymbol', 'symbol'].some(function (display) {
      try {
        var parts = new Intl.NumberFormat('en', {
          style: 'currency', currency: code, currencyDisplay: display
        }).formatToParts(1);
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].type === 'currency') { sym = parts[i].value; return true; }
        }
      } catch (e) { /* unsupported option - try the next one */ }
      return false;
    });
    symbolCache[code] = sym;
    return sym;
  }

  // Every country, sorted by name. `nameEn` is kept so search still works when
  // the list is shown in another language.
  var countryList = null;
  function countries() {
    if (countryList) return countryList;
    countryList = Object.keys(COUNTRY_TO_CURRENCY).map(function (cc) {
      var cur = COUNTRY_TO_CURRENCY[cc];
      return {
        country: cc,
        name: displayName('region', cc, cc),
        nameEn: displayName('region', cc, cc, 'en'),
        flag: flagOf(cc),
        currency: cur,
        symbol: symbolOf(cur),
        currencyName: displayName('currency', cur, cur),
        currencyNameEn: displayName('currency', cur, cur, 'en')
      };
    });
    countryList.sort(function (a, b) {
      try { return a.name.localeCompare(b.name, displayLang); }
      catch (e) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; }
    });
    return countryList;
  }

  // Currencies with no country row above, so every ISO-4217 code stays reachable.
  var extraList = null;
  function extraCurrencies() {
    if (extraList) return extraList;
    var used = {};
    Object.keys(COUNTRY_TO_CURRENCY).forEach(function (cc) { used[COUNTRY_TO_CURRENCY[cc]] = true; });
    var all = [];
    try {
      all = (Intl.supportedValuesOf ? Intl.supportedValuesOf('currency') : []) || [];
    } catch (e) { all = []; }
    extraList = all.filter(function (c) { return !used[c]; }).map(function (c) {
      return {
        country: '', name: displayName('currency', c, c), nameEn: displayName('currency', c, c, 'en'),
        flag: '', currency: c, symbol: symbolOf(c),
        currencyName: displayName('currency', c, c),
        currencyNameEn: displayName('currency', c, c, 'en')
      };
    });
    return extraList;
  }

  // Time zones that got renamed: look-ups must work under either spelling.
  var TZ_ALIASES = {
    'Asia/Kolkata': 'Asia/Calcutta', 'Asia/Calcutta': 'Asia/Kolkata',
    'Asia/Kathmandu': 'Asia/Katmandu', 'Asia/Katmandu': 'Asia/Kathmandu',
    'Asia/Yangon': 'Asia/Rangoon', 'Asia/Rangoon': 'Asia/Yangon',
    'Asia/Ho_Chi_Minh': 'Asia/Saigon', 'Asia/Saigon': 'Asia/Ho_Chi_Minh',
    'Asia/Dhaka': 'Asia/Dacca', 'Asia/Dacca': 'Asia/Dhaka',
    'Asia/Thimphu': 'Asia/Thimbu', 'Asia/Thimbu': 'Asia/Thimphu',
    'Asia/Ulaanbaatar': 'Asia/Ulan_Bator', 'Asia/Ulan_Bator': 'Asia/Ulaanbaatar',
    'Europe/Kyiv': 'Europe/Kiev', 'Europe/Kiev': 'Europe/Kyiv',
    'America/Nuuk': 'America/Godthab', 'America/Godthab': 'America/Nuuk',
    'America/Argentina/Buenos_Aires': 'America/Buenos_Aires',
    'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
    'America/Indiana/Indianapolis': 'America/Indianapolis',
    'America/Indianapolis': 'America/Indiana/Indianapolis',
    'Africa/Asmara': 'Africa/Asmera', 'Africa/Asmera': 'Africa/Asmara',
    'Atlantic/Faroe': 'Atlantic/Faeroe', 'Atlantic/Faeroe': 'Atlantic/Faroe',
    'Pacific/Pohnpei': 'Pacific/Ponape', 'Pacific/Ponape': 'Pacific/Pohnpei',
    'Pacific/Chuuk': 'Pacific/Truk', 'Pacific/Truk': 'Pacific/Chuuk',
    'Europe/Istanbul': 'Asia/Istanbul', 'Asia/Istanbul': 'Europe/Istanbul'
  };

  // time zone -> country, inverted from the browser's own ICU data (no network,
  // no GPS permission, works offline).
  var tzMap = null;
  function timeZoneMap() {
    if (tzMap) return tzMap;
    tzMap = {};
    try {
      Object.keys(COUNTRY_TO_CURRENCY).forEach(function (cc) {
        var zones = null;
        try {
          var loc = new Intl.Locale('und-' + cc);
          zones = loc.getTimeZones ? loc.getTimeZones() : null;
        } catch (e) { zones = null; }
        (zones || []).forEach(function (z) {
          if (!tzMap[z]) tzMap[z] = cc;
          var alias = TZ_ALIASES[z];
          if (alias && !tzMap[alias]) tzMap[alias] = cc;
        });
      });
    } catch (e) { /* older browser - the locale fallback below still works */ }
    return tzMap;
  }

  /** Country from the device's time zone, i.e. roughly where the phone is. */
  function detectCountryFromTimeZone() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return null;
      var map = timeZoneMap();
      return map[tz] || map[TZ_ALIASES[tz]] || null;
    } catch (e) { return null; }
  }

  // Best guess of the user's country from the browser locale.
  function detectCountryFromLocale() {
    var tags = [];
    try {
      if (navigator.languages && navigator.languages.length) tags = tags.concat(navigator.languages);
      if (navigator.language) tags.push(navigator.language);
      tags.push(Intl.DateTimeFormat().resolvedOptions().locale);
    } catch (e) { /* ignore */ }
    for (var i = 0; i < tags.length; i++) {
      var region = null;
      try {
        var loc = new Intl.Locale(tags[i]);
        region = loc.region || (loc.maximize && loc.maximize().region);
      } catch (e) {
        var m = String(tags[i]).match(/-([A-Za-z]{2})(?:-|$)/);
        region = m && m[1];
      }
      if (region) {
        region = region.toUpperCase();
        if (COUNTRY_TO_CURRENCY[region]) return region;
      }
    }
    return null;
  }

  /**
   * Where the user is: the device time zone first (that is the real location
   * signal), then the browser's language region.
   */
  function detectCountry() {
    return detectCountryFromTimeZone() || detectCountryFromLocale();
  }

  function currencyFor(cc) { return COUNTRY_TO_CURRENCY[cc] || null; }

  /**
   * Locale used to format money and dates: the app's language with the chosen
   * country's region, e.g. "hi-IN" or "en-JP".
   */
  function localeFor(country, lang) {
    var base = lang || 'en';
    if (!lang) {
      try { base = (navigator.language || 'en').split('-')[0] || 'en'; } catch (e) { base = 'en'; }
    }
    if (!country) return base;
    var tag = base + '-' + country;
    try {
      new Intl.NumberFormat(tag);
      return tag;
    } catch (e) { return base; }
  }

  var fmtCache = {};
  function formatter(locale, currency, digits, compact) {
    var key = [locale, currency, digits, compact].join('|');
    if (fmtCache[key]) return fmtCache[key];
    var opts = {
      style: 'currency', currency: currency, currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: digits, maximumFractionDigits: digits
    };
    if (compact) {
      opts.notation = 'compact';
      delete opts.minimumFractionDigits;
      opts.maximumFractionDigits = 1;
    }
    var f;
    try { f = new Intl.NumberFormat(locale, opts); } catch (e) {
      opts.currencyDisplay = 'symbol';
      try { f = new Intl.NumberFormat(locale, opts); }
      catch (e2) { f = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }); }
    }
    fmtCache[key] = f;
    return f;
  }

  /**
   * Format an amount as money.
   * state: {currency, locale, country}; opts: {compact:bool, digits:number|'auto'}
   */
  function money(amount, state, opts) {
    opts = opts || {};
    var n = Number(amount) || 0;
    var cur = (state && state.currency) || 'INR';
    var loc = (state && state.locale) || localeFor((state && state.country) || 'IN');
    var digits = opts.digits;
    if (digits === undefined || digits === 'auto') {
      digits = Math.abs(n - Math.round(n)) < 0.005 ? 0 : 2;
    }
    return formatter(loc, cur, digits, !!opts.compact).format(n);
  }

  global.Currencies = {
    countries: countries,
    extraCurrencies: extraCurrencies,
    detectCountry: detectCountry,
    detectCountryFromTimeZone: detectCountryFromTimeZone,
    detectCountryFromLocale: detectCountryFromLocale,
    setDisplayLang: setDisplayLang,
    currencyFor: currencyFor,
    localeFor: localeFor,
    symbolOf: symbolOf,
    flagOf: flagOf,
    money: money
  };
})(window);
