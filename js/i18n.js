/* i18n.js - English + Hindi strings, and the helpers that put them on screen.
   t('key', {var: 'x'})  ->  string      tc('key', n)  ->  plural string
   apply(root)           ->  fills every [data-i18n*] element in the DOM. */
(function (global) {
  'use strict';

  var STRINGS = {
    en: {
      'app.name': 'Expense Tracker',
      'app.tagline': 'Know what you can spend today',
      'side.tagline': 'Track · Plan · Save',
      'side.promoTitle': 'Stay in control of your money',
      'side.promoSub': 'Track expenses, manage your budget and build better spending habits.',
      'a11y.mainNav': 'Main',
      'nav.dashboard': 'Dashboard',
      'nav.home': 'Home',
      'nav.history': 'History',
      'nav.settings': 'Settings',

      'a11y.theme': 'Change theme',
      'a11y.lang': 'Change language',
      'a11y.currency': 'Change country and currency',
      'a11y.addExpense': 'Add an expense',
      'a11y.close': 'Close',
      'a11y.prevMonth': 'Previous month',
      'a11y.nextMonth': 'Next month',
      'a11y.catIcon': 'Category icon',
      'a11y.catName': 'New category name',
      'a11y.searchCountry': 'Search country or currency',
      'a11y.chartRange': 'Chart range',
      'a11y.limitMode': 'How the daily limit is worked out',
      'a11y.deleteCat': 'Delete {name}',
      'a11y.catBudget': 'Monthly limit for {name}',

      'home.heading': 'Dashboard',
      'home.pageTitle': 'Your money, at a glance',
      'home.pageSub': 'Track your spending, manage your budget and make smarter money decisions.',
      'home.addExpense': 'Add expense',
      'home.vsYesterday': '{pct} vs yesterday',
      'home.spentToday': 'Spent today',
      'home.noExpensesToday': 'No expenses yet today',
      'home.expensesToday.one': '{n} expense today',
      'home.expensesToday.other': '{n} expenses today',
      'home.ofLimitToday': '{spent} of {limit} today',

      'tile.limit': 'Safe to spend / day',
      'tile.leftToday': 'Left today',
      'tile.month': 'Spent this month',
      'tile.remaining': 'Budget left',
      'tile.setBudgetFirst': 'Set a budget first',
      'tile.tapToShow': 'Tap to show',
      'a11y.showAmount': 'tap to show the amount',
      'a11y.hideAmount': 'tap to hide the amount',
      'tile.divDays': '{amount} ÷ {n} days',
      'tile.overLimit': 'over today’s limit',
      'tile.stillSafe': 'still safe today',
      'tile.monthNote': '{count} · {avg}/day avg',
      'tile.overBudget': 'over budget · ',
      'tile.noBudget': 'No budget set',

      'budget.title': 'Monthly budget',
      'budget.ofBudget': '{spent} of {budget}',
      'common.edit': 'Edit',
      'budget.set': 'Set a budget',

      'facts.daysGone': 'Days gone',
      'facts.daysGoneValue': '{a} of {b}',
      'facts.avgPerDay': 'Average per day',
      'facts.dailyLimit': 'Daily limit ({mode})',
      'facts.projected': 'Projected month end',
      'mode.adaptive': 'adaptive',
      'mode.flat': 'flat',

      'chart.title': 'Daily spending',
      'chart.sub7': 'Each column is one day’s total. The dashed line is today’s limit.',
      'chart.sub30': 'Last 30 days. The dashed line is today’s limit.',
      'chart.range7': '7 days',
      'chart.range30': '30 days',
      'chart.aria': 'Spending per day for the last {n} days',
      'chart.empty': 'No spending in this range.',

      'table.show': 'Show as table',
      'table.day': 'Day',
      'table.spent': 'Spent',
      'table.category': 'Category',
      'table.share': 'Share',

      'cats.title': 'Where the money went',
      'catbud.title': 'Category budgets',
      'catbud.of': '{spent} of {budget}',
      'cats.empty': 'Add an expense to see the split by category.',
      'cats.more': '+{count} in the table below.',
      'cats.other': 'Others',
      'cats.totalSpent': 'Total spent',

      'recent.title': 'Recent expenses',
      'recent.seeAll': 'See all',
      'recent.empty': 'No expenses yet. Tap + to add your first one.',

      'alert.setBudget.title': 'Set a monthly budget',
      'alert.setBudget.body': 'Add your budget in Settings to get a daily spending limit.',
      'alert.overBudget.title': 'Monthly budget crossed',
      'alert.overBudget.body': 'You are <b>{over}</b> over the {budget} budget, with {days} to go.',
      'alert.nearBudget.title': '{pct} of the budget used',
      'alert.nearBudget.body': '{left} left for the last {days}.',
      'alert.overLimit.title': 'Today’s limit crossed',
      'alert.overLimit.body': 'Spent <b>{spent}</b> against a limit of {limit}.',
      'alert.overLimit.tomorrow': ' Tomorrow’s limit drops to {amount}.',
      'alert.nearLimit.title': 'Close to today’s limit',
      'alert.nearLimit.body': 'Only <b>{left}</b> left of today’s {limit}.',
      'alert.pace.title': 'This pace crosses the budget',
      'alert.catOver.title': '{name} is past its limit',
      'alert.catOver.body': '{over} over the {budget} you set for it.',
      'alert.catNear.title': '{name} is at {pct} of its limit',
      'alert.catNear.body': 'Only {left} left of the {budget} you set for it.',
      'alert.pace.body': 'At {avg}/day you would end the month near <b>{projected}</b> against a {budget} budget.',

      'hist.heading': 'History',
      'hist.thisMonth': ' · this month',
      'hist.range': '{from} – {to} · {days}',
      'hist.total': 'Total spent',
      'hist.count': 'Expenses',
      'hist.daysWithSpending': 'Days with spending',
      'hist.highestDay': 'Highest day',
      'hist.budget': 'Budget',
      'hist.overBy': 'Over budget by',
      'hist.underBy': 'Under budget by',
      'hist.search': 'Search',
      'hist.searchPh': 'Note or amount',
      'hist.allCats': 'All categories',
      'hist.noMatch': 'Nothing matches this filter.',
      'hist.empty': 'No expenses recorded for {month}.',

      'day.today': 'Today',
      'day.yesterday': 'Yesterday',

      'sheet.add': 'Add expense',
      'sheet.edit': 'Edit expense',
      'sheet.amount': 'Amount',
      'sheet.category': 'Category',
      'sheet.note': 'Note',
      'sheet.optional': '(optional)',
      'sheet.notePh': 'Tea with friends',
      'sheet.date': 'Date',
      'sheet.cancel': 'Cancel',
      'sheet.save': 'Save expense',
      'sheet.saveChanges': 'Save changes',
      'sheet.delete': 'Delete',
      'sheet.leftToday': 'Left for today: {left} of {limit}.',
      'sheet.amountError': 'Enter an amount greater than zero.',

      'picker.title': 'Country & currency',
      'picker.searchPh': 'Search country or currency',
      'picker.allCountries': 'All countries',
      'picker.nothing': 'Nothing found',
      'picker.auto': 'Detect automatically',
      'picker.autoSub': 'From your device time zone',

      'welcome.title': 'Set up in 10 seconds',
      'welcome.sub': 'Pick your currency and set a monthly budget — both can be changed later.',
      'welcome.budgetHint': 'Not sure? Put your usual monthly spend — you can fix it anytime.',
      'welcome.skip': 'Skip',
      'welcome.start': 'Start tracking',

      'set.heading': 'Settings',
      'set.money': 'Money',
      'set.countryCurrency': 'Country & currency',
      'set.selectCountry': 'Select country',
      'set.currencyHint': 'Every country is listed — amounts, symbol and number format follow your choice.',
      'set.budget': 'Monthly budget',
      'set.budgetHint': 'Your daily limit is worked out from this.',
      'set.cycleStart': 'Budget month starts on day',
      'set.cycleHint': 'Set your salary date to track a salary-to-salary cycle. In a month that is too short for the day you pick, the cycle starts on that month’s last day.',
      'set.calendarMonth': '{day} (calendar month)',
      'set.limitTitle': 'Daily limit',
      'set.adaptive': 'Adaptive (recommended)',
      'set.adaptiveDesc': 'Budget left ÷ days left. Overspend today and tomorrow’s limit drops.',
      'set.flat': 'Flat',
      'set.flatDesc': 'Budget ÷ days in the month. The same number every day.',
      'set.warnAt': 'Warn me when the month reaches {pct} of the budget',
      'set.alertsOn': 'Show spending alerts',
      'set.categories': 'Categories',
      'set.catBudgetHint': 'Give a category its own monthly limit and the app warns you before it runs out. Leave it empty for no limit.',
      'set.newCategory': 'New category',
      'set.add': 'Add',
      'set.appearance': 'Appearance',
      'set.theme': 'Theme',
      'set.language': 'Language',
      'theme.auto': 'Match my phone',
      'theme.light': 'Light',
      'theme.dark': 'Dark',
      'set.data': 'Your data',
      'set.dataHint': 'Everything is stored on this device only. Nothing is uploaded anywhere.',
      'set.backup': 'Backup (JSON)',
      'set.exportCsv': 'Export CSV',
      'set.restore': 'Restore backup',
      'set.deleteAll': 'Delete all expenses',
      'set.savedNote': 'Saved on this device ({count}).',
      'set.storageBlocked': 'Warning: this browser is blocking local storage, so data will be lost when you close the app. Export a backup.',
      'set.footer': 'Expense Tracker · works offline · v1.0',

      'toast.updated': 'Expense updated',
      'toast.deleted': 'Expense deleted',
      'toast.undo': 'Undo',
      'toast.savedLimitCrossed': 'Saved · today’s limit crossed by {amount}',
      'toast.savedLeft': 'Saved · {amount} left today',
      'toast.saved': 'Expense saved',
      'toast.catBudgetSet': '{name} limit set to {amount}',
      'toast.catAdded': 'Category added',
      'toast.backup': 'Backup downloaded',
      'toast.csv': 'CSV exported',
      'toast.currencySet': 'Currency set to {cur}',
      'toast.detected': 'Detected {country} · {cur}',
      'toast.detectFailed': 'Could not detect your country — pick it from the list',
      'toast.allSet': 'All set · tap + to add an expense',
      'toast.cleared': 'All expenses deleted',
      'toast.importFail': 'Could not read that file',
      'toast.imported': '{count} imported',
      'toast.restored': 'Backup restored',
      'toast.theme': 'Theme: {name}',
      'toast.language': 'Language: {name}',

      'confirm.deleteCatUsed': 'Delete "{name}"? {count} will move to another category.',
      'confirm.deleteCat': 'Delete "{name}"?',
      'confirm.import': 'Add these expenses to what is already here?\n\nOK = merge, Cancel = replace everything.',
      'confirm.clear': 'Delete every expense? Settings and categories stay. This cannot be undone.',

      'count.expense.one': '{n} expense',
      'count.expense.other': '{n} expenses',
      'count.day.one': '{n} day',
      'count.day.other': '{n} days',
      'count.dayLeft.one': '{n} day left',
      'count.dayLeft.other': '{n} days left',
      'count.category.one': '{n} category',
      'count.category.other': '{n} categories',
      'count.moreCategory.one': '{n} more category',
      'count.moreCategory.other': '{n} more categories',

      'cat.food': 'Food & Drinks',
      'cat.groceries': 'Groceries',
      'cat.transport': 'Transport',
      'cat.bills': 'Bills & Utilities',
      'cat.rent': 'Rent',
      'cat.shopping': 'Shopping',
      'cat.health': 'Health',
      'cat.education': 'Education',
      'cat.fun': 'Entertainment',
      'cat.mobile': 'Mobile & Internet',
      'cat.other': 'Other'
    },

    hi: {
      'app.name': 'एक्सपेंस ट्रैकर',
      'app.tagline': 'आज कितना खर्च कर सकते हैं, तुरंत पता',
      'side.tagline': 'हिसाब · योजना · बचत',
      'side.promoTitle': 'पैसा आपके कंट्रोल में',
      'side.promoSub': 'खर्च का हिसाब रखें, बजट संभालें और बेहतर आदतें बनाएँ।',
      'a11y.mainNav': 'मुख्य',
      'nav.dashboard': 'डैशबोर्ड',
      'nav.home': 'होम',
      'nav.history': 'हिसाब',
      'nav.settings': 'सेटिंग',

      'a11y.theme': 'थीम बदलें',
      'a11y.lang': 'भाषा बदलें',
      'a11y.currency': 'देश और करेंसी बदलें',
      'a11y.addExpense': 'खर्च जोड़ें',
      'a11y.close': 'बंद करें',
      'a11y.prevMonth': 'पिछला महीना',
      'a11y.nextMonth': 'अगला महीना',
      'a11y.catIcon': 'कैटेगरी आइकन',
      'a11y.catName': 'नई कैटेगरी का नाम',
      'a11y.searchCountry': 'देश या करेंसी खोजें',
      'a11y.chartRange': 'चार्ट की अवधि',
      'a11y.limitMode': 'रोज़ की लिमिट कैसे निकले',
      'a11y.deleteCat': '{name} डिलीट करें',
      'a11y.catBudget': '{name} की महीने की लिमिट',

      'home.heading': 'डैशबोर्ड',
      'home.pageTitle': 'एक नज़र में आपका पैसा',
      'home.pageSub': 'खर्च पर नज़र रखें, बजट संभालें और पैसे के बेहतर फ़ैसले लें।',
      'home.addExpense': 'खर्च जोड़ें',
      'home.vsYesterday': 'कल से {pct}',
      'home.spentToday': 'आज का खर्च',
      'home.noExpensesToday': 'आज अभी कोई खर्च नहीं',
      'home.expensesToday.one': 'आज {n} खर्च',
      'home.expensesToday.other': 'आज {n} खर्च',
      'home.ofLimitToday': 'आज {limit} में से {spent}',

      'tile.limit': 'रोज़ का सुरक्षित खर्च',
      'tile.leftToday': 'आज बचा',
      'tile.month': 'इस महीने खर्च',
      'tile.remaining': 'बजट बचा',
      'tile.setBudgetFirst': 'पहले बजट सेट करें',
      'tile.tapToShow': 'देखने के लिए टैप करें',
      'a11y.showAmount': 'रकम देखने के लिए टैप करें',
      'a11y.hideAmount': 'रकम छिपाने के लिए टैप करें',
      'tile.divDays': '{amount} ÷ {n} दिन',
      'tile.overLimit': 'आज की लिमिट से ज़्यादा',
      'tile.stillSafe': 'अभी ठीक चल रहा है',
      'tile.monthNote': '{count} · औसत {avg}/दिन',
      'tile.overBudget': 'बजट से ज़्यादा · ',
      'tile.noBudget': 'कोई बजट सेट नहीं',

      'budget.title': 'महीने का बजट',
      'budget.ofBudget': '{budget} में से {spent}',
      'common.edit': 'बदलें',
      'budget.set': 'बजट सेट करें',

      'facts.daysGone': 'दिन बीते',
      'facts.daysGoneValue': '{b} में से {a}',
      'facts.avgPerDay': 'रोज़ का औसत',
      'facts.dailyLimit': 'रोज़ की लिमिट ({mode})',
      'facts.projected': 'महीने के अंत का अनुमान',
      'mode.adaptive': 'अडैप्टिव',
      'mode.flat': 'फ्लैट',

      'chart.title': 'रोज़ का खर्च',
      'chart.sub7': 'हर कॉलम एक दिन का कुल खर्च है। डॉटेड लाइन आज की लिमिट है।',
      'chart.sub30': 'पिछले 30 दिन। डॉटेड लाइन आज की लिमिट है।',
      'chart.range7': '7 दिन',
      'chart.range30': '30 दिन',
      'chart.aria': 'पिछले {n} दिन का रोज़ाना खर्च',
      'chart.empty': 'इस अवधि में कोई खर्च नहीं।',

      'table.show': 'टेबल में देखें',
      'table.day': 'दिन',
      'table.spent': 'खर्च',
      'table.category': 'कैटेगरी',
      'table.share': 'हिस्सा',

      'cats.title': 'पैसा कहाँ गया',
      'catbud.title': 'कैटेगरी के बजट',
      'catbud.of': '{budget} में से {spent}',
      'cats.empty': 'कैटेगरी के हिसाब से देखने के लिए खर्च जोड़ें।',
      'cats.more': '+{count} नीचे टेबल में।',
      'cats.other': 'अन्य',
      'cats.totalSpent': 'कुल खर्च',

      'recent.title': 'हाल के खर्च',
      'recent.seeAll': 'सब देखें',
      'recent.empty': 'अभी कोई खर्च नहीं। पहला खर्च जोड़ने के लिए + दबाएँ।',

      'alert.setBudget.title': 'महीने का बजट सेट करें',
      'alert.setBudget.body': 'रोज़ की खर्च लिमिट पाने के लिए सेटिंग में बजट डालें।',
      'alert.overBudget.title': 'महीने का बजट पार हो गया',
      'alert.overBudget.body': '{budget} के बजट से <b>{over}</b> ज़्यादा खर्च हो चुका है, और अभी {days} बाकी हैं।',
      'alert.nearBudget.title': 'बजट का {pct} खर्च हो चुका',
      'alert.nearBudget.body': 'आखिरी {days} के लिए {left} बचे हैं।',
      'alert.overLimit.title': 'आज की लिमिट पार हो गई',
      'alert.overLimit.body': '{limit} की लिमिट में <b>{spent}</b> खर्च हो गया।',
      'alert.overLimit.tomorrow': ' कल की लिमिट घटकर {amount} रह जाएगी।',
      'alert.nearLimit.title': 'आज की लिमिट के करीब',
      'alert.nearLimit.body': 'आज के {limit} में से सिर्फ़ <b>{left}</b> बचे हैं।',
      'alert.pace.title': 'इस रफ़्तार से बजट पार हो जाएगा',
      'alert.catOver.title': '{name} की लिमिट पार हो गई',
      'alert.catOver.body': 'आपकी तय की {budget} से {over} ज़्यादा।',
      'alert.catNear.title': '{name} अपनी लिमिट के {pct} पर है',
      'alert.catNear.body': 'आपकी तय की {budget} में से सिर्फ़ {left} बचे।',
      'alert.pace.body': '{avg}/दिन के हिसाब से महीना <b>{projected}</b> पर खत्म होगा, जबकि बजट {budget} है।',

      'hist.heading': 'हिसाब',
      'hist.thisMonth': ' · यह महीना',
      'hist.range': '{from} – {to} · {days}',
      'hist.total': 'कुल खर्च',
      'hist.count': 'खर्च',
      'hist.daysWithSpending': 'खर्च वाले दिन',
      'hist.highestDay': 'सबसे ज़्यादा खर्च वाला दिन',
      'hist.budget': 'बजट',
      'hist.overBy': 'बजट से ज़्यादा',
      'hist.underBy': 'बजट से कम',
      'hist.search': 'खोजें',
      'hist.searchPh': 'नोट या रकम',
      'hist.allCats': 'सभी कैटेगरी',
      'hist.noMatch': 'इस फ़िल्टर में कुछ नहीं मिला।',
      'hist.empty': '{month} में कोई खर्च दर्ज नहीं।',

      'day.today': 'आज',
      'day.yesterday': 'कल',

      'sheet.add': 'खर्च जोड़ें',
      'sheet.edit': 'खर्च बदलें',
      'sheet.amount': 'रकम',
      'sheet.category': 'कैटेगरी',
      'sheet.note': 'नोट',
      'sheet.optional': '(ज़रूरी नहीं)',
      'sheet.notePh': 'दोस्तों के साथ चाय',
      'sheet.date': 'तारीख',
      'sheet.cancel': 'रहने दें',
      'sheet.save': 'खर्च सेव करें',
      'sheet.saveChanges': 'बदलाव सेव करें',
      'sheet.delete': 'डिलीट',
      'sheet.leftToday': 'आज के लिए {limit} में से {left} बचे हैं।',
      'sheet.amountError': 'शून्य से ज़्यादा रकम डालें।',

      'picker.title': 'देश और करेंसी',
      'picker.searchPh': 'देश या करेंसी खोजें',
      'picker.allCountries': 'सभी देश',
      'picker.nothing': 'कुछ नहीं मिला',
      'picker.auto': 'अपने आप पता लगाएँ',
      'picker.autoSub': 'आपके फ़ोन के टाइम ज़ोन से',

      'welcome.title': '10 सेकंड में सेटअप',
      'welcome.sub': 'अपनी करेंसी चुनें और महीने का बजट डालें — दोनों बाद में बदल सकते हैं।',
      'welcome.budgetHint': 'पक्का नहीं? अपना आम महीने का खर्च डाल दें — कभी भी बदल सकते हैं।',
      'welcome.skip': 'छोड़ें',
      'welcome.start': 'शुरू करें',

      'set.heading': 'सेटिंग',
      'set.money': 'पैसा',
      'set.countryCurrency': 'देश और करेंसी',
      'set.selectCountry': 'देश चुनें',
      'set.currencyHint': 'सभी देश मौजूद हैं — रकम, चिह्न और नंबर फ़ॉर्मेट आपकी पसंद से चलेंगे।',
      'set.budget': 'महीने का बजट',
      'set.budgetHint': 'रोज़ की लिमिट इसी से निकलती है।',
      'set.cycleStart': 'बजट महीना शुरू होने की तारीख',
      'set.cycleHint': 'सैलरी की तारीख डालें तो सैलरी-से-सैलरी का हिसाब चलेगा। जिस महीने में वह तारीख न हो, उस महीने का हिसाब उसके आख़िरी दिन से शुरू होगा।',
      'set.calendarMonth': '{day} (कैलेंडर महीना)',
      'set.limitTitle': 'रोज़ की लिमिट',
      'set.adaptive': 'अडैप्टिव (सुझाया गया)',
      'set.adaptiveDesc': 'बचा बजट ÷ बचे दिन। आज ज़्यादा खर्च किया तो कल की लिमिट घट जाएगी।',
      'set.flat': 'फ्लैट',
      'set.flatDesc': 'बजट ÷ महीने के दिन। रोज़ एक जैसा।',
      'set.warnAt': 'जब महीना बजट के {pct} पर पहुँचे तो चेतावनी दें',
      'set.alertsOn': 'खर्च की चेतावनी दिखाएँ',
      'set.categories': 'कैटेगरी',
      'set.catBudgetHint': 'किसी कैटेगरी की अपनी महीने की लिमिट डालें, तो खत्म होने से पहले ऐप चेतावनी देगा। खाली छोड़ें तो कोई लिमिट नहीं।',
      'set.newCategory': 'नई कैटेगरी',
      'set.add': 'जोड़ें',
      'set.appearance': 'दिखावट',
      'set.theme': 'थीम',
      'set.language': 'भाषा',
      'theme.auto': 'फ़ोन जैसा',
      'theme.light': 'लाइट',
      'theme.dark': 'डार्क',
      'set.data': 'आपका डेटा',
      'set.dataHint': 'सब कुछ सिर्फ़ इसी फ़ोन में सेव होता है। कहीं अपलोड नहीं होता।',
      'set.backup': 'बैकअप (JSON)',
      'set.exportCsv': 'CSV एक्सपोर्ट',
      'set.restore': 'बैकअप वापस लाएँ',
      'set.deleteAll': 'सारे खर्च डिलीट करें',
      'set.savedNote': 'इस फ़ोन में सेव ({count})।',
      'set.storageBlocked': 'चेतावनी: यह ब्राउज़र लोकल स्टोरेज ब्लॉक कर रहा है, इसलिए ऐप बंद करते ही डेटा चला जाएगा। बैकअप ले लें।',
      'set.footer': 'एक्सपेंस ट्रैकर · ऑफ़लाइन चलता है · v1.0',

      'toast.updated': 'खर्च अपडेट हो गया',
      'toast.deleted': 'खर्च डिलीट हो गया',
      'toast.undo': 'वापस लाएँ',
      'toast.savedLimitCrossed': 'सेव · आज की लिमिट {amount} से पार',
      'toast.savedLeft': 'सेव · आज {amount} बचे हैं',
      'toast.saved': 'खर्च सेव हो गया',
      'toast.catBudgetSet': '{name} की लिमिट {amount} सेट हुई',
      'toast.catAdded': 'कैटेगरी जुड़ गई',
      'toast.backup': 'बैकअप डाउनलोड हो गया',
      'toast.csv': 'CSV एक्सपोर्ट हो गया',
      'toast.currencySet': 'करेंसी {cur} हो गई',
      'toast.detected': '{country} · {cur} मिला',
      'toast.detectFailed': 'देश का पता नहीं चला — लिस्ट से चुन लें',
      'toast.allSet': 'हो गया · खर्च जोड़ने के लिए + दबाएँ',
      'toast.cleared': 'सारे खर्च डिलीट हो गए',
      'toast.importFail': 'यह फ़ाइल पढ़ी नहीं जा सकी',
      'toast.imported': '{count} इम्पोर्ट हुए',
      'toast.restored': 'बैकअप वापस आ गया',
      'toast.theme': 'थीम: {name}',
      'toast.language': 'भाषा: {name}',

      'confirm.deleteCatUsed': '"{name}" डिलीट करें? {count} दूसरी कैटेगरी में चले जाएँगे।',
      'confirm.deleteCat': '"{name}" डिलीट करें?',
      'confirm.import': 'इन खर्चों को मौजूदा डेटे में जोड़ें?\n\nOK = जोड़ें, Cancel = सब बदल दें।',
      'confirm.clear': 'सारे खर्च डिलीट करें? सेटिंग और कैटेगरी रहेंगी। यह वापस नहीं होगा।',

      'count.expense.one': '{n} खर्च',
      'count.expense.other': '{n} खर्च',
      'count.day.one': '{n} दिन',
      'count.day.other': '{n} दिन',
      'count.dayLeft.one': '{n} दिन बाकी',
      'count.dayLeft.other': '{n} दिन बाकी',
      'count.category.one': '{n} कैटेगरी',
      'count.category.other': '{n} कैटेगरी',
      'count.moreCategory.one': '{n} और कैटेगरी',
      'count.moreCategory.other': '{n} और कैटेगरी',

      'cat.food': 'खाना-पीना',
      'cat.groceries': 'राशन',
      'cat.transport': 'आना-जाना',
      'cat.bills': 'बिल',
      'cat.rent': 'किराया',
      'cat.shopping': 'शॉपिंग',
      'cat.health': 'सेहत',
      'cat.education': 'पढ़ाई',
      'cat.fun': 'मनोरंजन',
      'cat.mobile': 'मोबाइल-इंटरनेट',
      'cat.other': 'अन्य'
    }
  };

  var LANGS = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' }
  ];

  var lang = 'en';

  function detect() {
    try {
      var tags = (navigator.languages && navigator.languages.length)
        ? navigator.languages : [navigator.language || 'en'];
      for (var i = 0; i < tags.length; i++) {
        var base = String(tags[i]).toLowerCase().split('-')[0];
        if (STRINGS[base]) return base;
      }
    } catch (e) { /* ignore */ }
    return 'en';
  }

  function fill(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (whole, key) {
      return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : whole;
    });
  }

  /** Translate a key. Falls back to English, then to the key itself. */
  function t(key, vars) {
    var table = STRINGS[lang] || STRINGS.en;
    var str = table[key];
    if (str === undefined) str = STRINGS.en[key];
    if (str === undefined) str = key;
    return fill(str, vars);
  }

  /** Translate a counted string: tc('count.day', 3) -> "3 days" */
  function tc(key, n, vars) {
    var all = {};
    if (vars) Object.keys(vars).forEach(function (k) { all[k] = vars[k]; });
    all.n = n;
    return t(key + (Number(n) === 1 ? '.one' : '.other'), all);
  }

  /** A category's name in the current language (custom names pass through). */
  function catName(cat) {
    if (!cat) return '';
    var table = STRINGS[lang] || STRINGS.en;
    var key = 'cat.' + cat.id;
    return table[key] !== undefined ? table[key] : cat.name;
  }

  function setLang(next) {
    lang = STRINGS[next] ? next : 'en';
    try { document.documentElement.setAttribute('lang', lang); } catch (e) { /* ignore */ }
    return lang;
  }

  function langName(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i].name;
    return code;
  }

  /** Fill every [data-i18n*] element under root. */
  function apply(root) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n]'), function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-ph]'), function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-aria]'), function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-title]'), function (el) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  global.I18n = {
    t: t,
    tc: tc,
    catName: catName,
    apply: apply,
    setLang: setLang,
    detect: detect,
    langName: langName,
    languages: function () { return LANGS.slice(); },
    current: function () { return lang; },
    keys: function (code) { return Object.keys(STRINGS[code] || {}); }
  };
})(window);
