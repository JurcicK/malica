export type Language = 'sl' | 'en' | 'uk'

type TranslationTree = {
  appName: string
  heroTitle: string
  heroBody: string
  heroMetricEmployees: string
  heroMetricDays: string
  heroMetricOpenDays: string
  demoAccess: string
  demoAdmin: string
  demoEmployee: string
  languageLabel: string
  languages: Record<Language, string>
  loginTitle: string
  loginSubtitle: string
  username: string
  password: string
  loginButton: string
  badLogin: string
  logout: string
  loading: string
  weekSourceIntro: string
  welcome: string
  employeeIntro: string
  adminIntro: string
  days: string
  availableMeals: string
  registrationsForDay: string
  locked: string
  open: string
  selected: string
  nothingSelected: string
  selectedForDay: string
  remove: string
  adminOverview: string
  whoOrdered: string
  noOrders: string
  manualEntry: string
  addMeal: string
  addMealHint: string
  category: string
  categoryLabels: Record<string, string>
  day: string
  mealTitle: string
  description: string
  allergens: string
  optional: string
  addToOffer: string
  addingMeal: string
  edit: string
  saveDraft: string
  mealPlaceholder: string
  cutoffAt: string
  orderingClosed: string
  orderingOpen: string
  orderSaved: string
  dayLockedMessage: string
  enterMealTitle: string
  mealAdded: string
  mealAddedFallback: string
  translationUnavailable: string
  chooseMealTitle: string
  chooseMealText: string
  cancel: string
  confirm: string
  chooseMealButton: string
}

export const translations: Record<Language, TranslationTree> = {
  sl: {
    appName: 'Malica App',
    heroTitle: 'Naročanje malic za ekipo brez klicev in Excel zmede.',
    heroBody: 'Zaposleni izberejo malico do 10. ure, admin pa vidi število prijav in točno kdo je prijavljen na posamezen meni.',
    heroMetricEmployees: 'demo zaposlenih v testnem pogledu',
    heroMetricDays: 'dni v tedenski ponudbi',
    heroMetricOpenDays: 'dni je trenutno še odprtih',
    demoAccess: 'Demo dostop',
    demoAdmin: 'Admin',
    demoEmployee: 'Zaposleni',
    languageLabel: 'Jezik',
    languages: { sl: 'Slovenščina', en: 'English', uk: 'Українська' },
    loginTitle: 'Vstop v testni MVP',
    loginSubtitle: 'To je zdaj frontend prototip z lokalnimi demo podatki. Naslednji korak bo vezava na Supabase.',
    username: 'Uporabniško ime',
    password: 'Geslo',
    loginButton: 'Prijava v aplikacijo',
    badLogin: 'Napačno uporabniško ime ali geslo.',
    logout: 'Odjava',
    loading: 'Nalagam aplikacijo...',
    weekSourceIntro: 'Vir ponudbe',
    welcome: 'Pozdravljen',
    employeeIntro: 'Izberi dan in shrani svojo malico pred dnevnim zaklepom ob 10.00.',
    adminIntro: 'Tukaj vidiš prijave po dnevih in lahko ročno dodajaš jedi iz tedenske ponudbe.',
    days: 'Dnevi',
    availableMeals: 'jedi na voljo',
    registrationsForDay: 'prijav za ta dan',
    locked: 'Zaklenjeno',
    open: 'Odprto',
    selected: 'Izbrano',
    nothingSelected: 'Ni še izbrano',
    selectedForDay: 'Izbrano:',
    remove: 'Odstrani',
    adminOverview: 'Admin pregled',
    whoOrdered: 'Kdo je naročen',
    noOrders: 'Za izbran dan še ni prijav.',
    manualEntry: 'Ročni vnos',
    addMeal: 'Dodaj novo jed',
    addMealHint: 'Tukaj simulirava tvoj tedenski proces iz Excela. Ko admin vnese jed, app sam pripravi angleški in ukrajinski prikaz.',
    category: 'Kategorija',
    categoryLabels: {
      'bodi fit': 'Bodi fit',
      vege: 'Vege',
      'ali pa..': 'Ali pa..',
      'na hitro...': 'Na hitro...',
      'stalna ponudba': 'Stalna ponudba',
    },
    day: 'Dan',
    mealTitle: 'Naziv jedi',
    description: 'Opis',
    allergens: 'Alergeni',
    optional: 'Opcijsko',
    addToOffer: 'Dodaj v ponudbo',
    addingMeal: 'Dodajam v ponudbo...',
    edit: 'Uredi',
    saveDraft: 'Shrani osnutek',
    mealPlaceholder: 'Vnesi malico...',
    cutoffAt: 'Zaklep ob',
    orderingClosed: 'Naročanje za ta dan je zaprto.',
    orderingOpen: 'Naročanje za ta dan je še odprto.',
    orderSaved: 'Malica za {day} je shranjena.',
    dayLockedMessage: '{day} je po {hour}. uri že zaklenjena.',
    enterMealTitle: 'Vnesi naziv jedi.',
    mealAdded: 'Nova jed je dodana v ponudbo.',
    mealAddedFallback: 'Nova jed je dodana v ponudbo. Uporabljen je lokalni rezervni prevod.',
    translationUnavailable: 'Samodejni prevod trenutno ni na voljo.',
    chooseMealTitle: 'Potrdi izbiro',
    chooseMealText: 'Ali res želiš izbrati to malico?',
    cancel: 'Prekliči',
    confirm: 'Potrdi',
    chooseMealButton: 'Izberi malico',
  },
  en: {
    appName: 'Lunch App',
    heroTitle: 'Meal ordering for the team without calls and Excel chaos.',
    heroBody: 'Employees choose their meal by 10:00, while the admin can see how many orders each menu has and exactly who ordered it.',
    heroMetricEmployees: 'demo employees in the test view',
    heroMetricDays: 'days in the weekly offer',
    heroMetricOpenDays: 'days still open right now',
    demoAccess: 'Demo access',
    demoAdmin: 'Admin',
    demoEmployee: 'Employee',
    languageLabel: 'Language',
    languages: { sl: 'Slovenian', en: 'English', uk: 'Ukrainian' },
    loginTitle: 'Enter the test MVP',
    loginSubtitle: 'This is currently a frontend prototype with local demo data. The next step is connecting it to Supabase.',
    username: 'Username',
    password: 'Password',
    loginButton: 'Log in',
    badLogin: 'Incorrect username or password.',
    logout: 'Log out',
    loading: 'Loading app...',
    weekSourceIntro: 'Offer source',
    welcome: 'Welcome',
    employeeIntro: 'Pick a day and save your meal before the daily lock at 10:00.',
    adminIntro: 'Here you can see orders by day and manually add meals from the weekly offer.',
    days: 'Days',
    availableMeals: 'meals available',
    registrationsForDay: 'orders for this day',
    locked: 'Locked',
    open: 'Open',
    selected: 'Selected',
    nothingSelected: 'Nothing selected yet',
    selectedForDay: 'Selected:',
    remove: 'Remove',
    adminOverview: 'Admin overview',
    whoOrdered: 'Who ordered',
    noOrders: 'There are no orders for the selected day yet.',
    manualEntry: 'Manual entry',
    addMeal: 'Add a new meal',
    addMealHint: 'This simulates your weekly Excel process. When the admin enters a meal, the app automatically prepares English and Ukrainian text.',
    category: 'Category',
    categoryLabels: {
      'bodi fit': 'Fit choice',
      vege: 'Veggie',
      'ali pa..': 'Or maybe..',
      'na hitro...': 'Quick option...',
      'stalna ponudba': 'Always available',
    },
    day: 'Day',
    mealTitle: 'Meal title',
    description: 'Description',
    allergens: 'Allergens',
    optional: 'Optional',
    addToOffer: 'Add to offer',
    addingMeal: 'Adding to offer...',
    edit: 'Edit',
    saveDraft: 'Save draft',
    mealPlaceholder: 'Enter meal...',
    cutoffAt: 'Cutoff at',
    orderingClosed: 'Ordering for this day is closed.',
    orderingOpen: 'Ordering for this day is still open.',
    orderSaved: 'Meal for {day} has been saved.',
    dayLockedMessage: '{day} is already locked after {hour}:00.',
    enterMealTitle: 'Enter a meal title.',
    mealAdded: 'New meal has been added to the offer.',
    mealAddedFallback: 'New meal has been added to the offer. Local fallback translation was used.',
    translationUnavailable: 'Automatic translation is currently unavailable.',
    chooseMealTitle: 'Confirm selection',
    chooseMealText: 'Do you really want to choose this meal?',
    cancel: 'Cancel',
    confirm: 'Confirm',
    chooseMealButton: 'Choose meal',
  },
  uk: {
    appName: 'Додаток Обід',
    heroTitle: 'Замовлення обідів для команди без дзвінків і хаосу в Excel.',
    heroBody: 'Працівники обирають страву до 10:00, а адміністратор бачить кількість замовлень на кожне меню і хто саме замовив.',
    heroMetricEmployees: 'демо-працівників у тестовому режимі',
    heroMetricDays: 'днів у тижневій пропозиції',
    heroMetricOpenDays: 'днів ще відкриті зараз',
    demoAccess: 'Демо-доступ',
    demoAdmin: 'Адміністратор',
    demoEmployee: 'Працівник',
    languageLabel: 'Мова',
    languages: { sl: 'Словенська', en: 'Англійська', uk: 'Українська' },
    loginTitle: 'Вхід у тестовий MVP',
    loginSubtitle: 'Зараз це фронтенд-прототип із локальними демо-даними. Наступний крок — підключення до Supabase.',
    username: 'Ім’я користувача',
    password: 'Пароль',
    loginButton: 'Увійти',
    badLogin: 'Неправильне ім’я користувача або пароль.',
    logout: 'Вийти',
    loading: 'Завантаження застосунку...',
    weekSourceIntro: 'Джерело пропозиції',
    welcome: 'Вітаємо',
    employeeIntro: 'Оберіть день і збережіть свою страву до щоденного блокування о 10:00.',
    adminIntro: 'Тут ти бачиш замовлення по днях і можеш вручну додавати страви з тижневої пропозиції.',
    days: 'Дні',
    availableMeals: 'страв доступно',
    registrationsForDay: 'замовлень на цей день',
    locked: 'Закрито',
    open: 'Відкрито',
    selected: 'Обрано',
    nothingSelected: 'Ще не обрано',
    selectedForDay: 'Обрано:',
    remove: 'Видалити',
    adminOverview: 'Огляд адміністратора',
    whoOrdered: 'Хто замовив',
    noOrders: 'На вибраний день ще немає замовлень.',
    manualEntry: 'Ручне додавання',
    addMeal: 'Додати нову страву',
    addMealHint: 'Це імітує твій щотижневий процес з Excel. Коли адміністратор вводить страву, застосунок автоматично готує англійський та український текст.',
    category: 'Категорія',
    categoryLabels: {
      'bodi fit': 'Фіт-меню',
      vege: 'Вегетаріанське',
      'ali pa..': 'Або ж..',
      'na hitro...': 'Швидкий варіант...',
      'stalna ponudba': 'Постійна пропозиція',
    },
    day: 'День',
    mealTitle: 'Назва страви',
    description: 'Опис',
    allergens: 'Алергени',
    optional: 'Необов’язково',
    addToOffer: 'Додати до меню',
    addingMeal: 'Додаю до меню...',
    edit: 'Редагувати',
    saveDraft: 'Зберегти чернетку',
    mealPlaceholder: 'Введи страву...',
    cutoffAt: 'Блокування о',
    orderingClosed: 'Замовлення на цей день закрито.',
    orderingOpen: 'Замовлення на цей день ще відкрите.',
    orderSaved: 'Страву на {day} збережено.',
    dayLockedMessage: '{day} уже закрито після {hour}:00.',
    enterMealTitle: 'Введи назву страви.',
    mealAdded: 'Нову страву додано до меню.',
    mealAddedFallback: 'Нову страву додано до меню. Використано локальний резервний переклад.',
    translationUnavailable: 'Автоматичний переклад зараз недоступний.',
    chooseMealTitle: 'Підтвердь вибір',
    chooseMealText: 'Ти справді хочеш обрати цю страву?',
    cancel: 'Скасувати',
    confirm: 'Підтвердити',
    chooseMealButton: 'Обрати страву',
  },
}

export function formatTranslation(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  )
}
