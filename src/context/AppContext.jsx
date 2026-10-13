import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

const TRANSLATIONS = {
  en: {
    // Nav
    myShift: 'My Shift',
    myRoutes: 'My Routes',
    admin: 'Admin',
    settings: 'Settings',
    qrCode: 'Mobile QR',

    // Settings Modal
    settingsTitle: 'Settings & Profile',
    activeDriver: 'Active Driver Profile',
    selectDriverPrompt: 'Select your driver name',
    noDriverSelected: 'No driver selected',
    language: 'Language',
    theme: 'Display Theme',
    themeNeon: 'Dark Neon Glow (Cyberpunk)',
    themeNeonDesc: 'Low-light optimized with electric cyan glow',
    themeExcel: 'Retro Excel (Classic 1997)',
    themeExcelDesc: 'Vintage spreadsheet with classic gridlines & formula bar',
    close: 'Close',
    save: 'Save',

    // Dashboard
    date: 'Date',
    driver: 'Driver',
    typeOrPickName: 'Type or pick your name',
    noScheduleForDate: 'No schedule has been uploaded for',
    selectNamePrompt: 'Select your name to see your shift.',
    notScheduledTitle: "You're not scheduled on this day.",
    notScheduledDesc: 'Enjoy the rest! If this looks wrong, check name spelling.',
    offToday: "You're OFF today 🎉",
    van: 'Van',
    route: 'Route',
    earliestStart: 'Earliest Start',
    latestStart: 'Latest Start',
    handoverNotes: 'Handover / Notes',
    newRouteBadge: 'New Route',
    doneTimesBadge: 'done',

    // Stats
    daysWorked: 'Days worked',
    diffRoutes: 'Different routes',
    diffVans: 'Different vans',
    topRoute: 'Top route',
    latestShift: 'Latest shift',
    firstTimeRoute: 'New route – first time you drive it!',
    doneBefore: 'You have done this route {times} time(s) before.',
    routesDoneHeading: 'Routes you have done',
    lastTime: 'Last time',
    allReportsHeading: 'All shift reports',
    addSpreadsheetBtn: '+ Add Spreadsheet',

    // Excel theme specific
    excelTitle: 'Microsoft Excel - VanShift_Schedule.xlsx',
    excelFile: 'File',
    excelEdit: 'Edit',
    excelView: 'View',
    excelInsert: 'Insert',
    excelFormat: 'Format',
    excelTools: 'Tools',
    excelData: 'Data',
    excelHelp: 'Help',
    excelFormulaLabel: 'fx',
    excelReady: 'Ready',
    excelSheet1: 'Shift_Today',
    excelSheet2: 'Route_Stats',
    excelSheet3: 'Admin_Upload',
  },
  pt: {
    // Nav
    myShift: 'O Meu Turno',
    myRoutes: 'As Minhas Rotas',
    admin: 'Administração',
    settings: 'Definições',
    qrCode: 'QR para Telemóvel',

    // Settings Modal
    settingsTitle: 'Definições & Perfil',
    activeDriver: 'Perfil do Motorista',
    selectDriverPrompt: 'Escolha o seu nome de motorista',
    noDriverSelected: 'Nenhum motorista selecionado',
    language: 'Idioma',
    theme: 'Tema Visual',
    themeNeon: 'Dark Neon Glow (Ciberpunk)',
    themeNeonDesc: 'Otimizado para baixa luminosidade com brilho ciano',
    themeExcel: 'Retro Excel (Clássico 1997)',
    themeExcelDesc: 'Folha de cálculo vintage com grelha e barra de fórmulas',
    close: 'Fechar',
    save: 'Guardar',

    // Dashboard
    date: 'Data',
    driver: 'Motorista',
    typeOrPickName: 'Digite ou escolha o seu nome',
    noScheduleForDate: 'Ainda não foi carregada nenhuma escala para',
    selectNamePrompt: 'Selecione o seu nome para consultar o seu turno.',
    notScheduledTitle: 'Não tem turno escalado para este dia.',
    notScheduledDesc: 'Aproveite a folga! Se houver erro, verifique a ortografia do nome.',
    offToday: 'Está de FOLGA hoje 🎉',
    van: 'Carrinha (Van)',
    route: 'Rota',
    earliestStart: 'Início Mais Cedo',
    latestStart: 'Início Mais Tarde',
    handoverNotes: 'Notas de Passagem (Handover)',
    newRouteBadge: 'Rota Nova',
    doneTimesBadge: 'feita',

    // Stats
    daysWorked: 'Dias trabalhados',
    diffRoutes: 'Rotas distintas',
    diffVans: 'Carrinhas diferentes',
    topRoute: 'Rota principal',
    latestShift: 'Último turno',
    firstTimeRoute: 'Rota nova – primeira vez que a faz!',
    doneBefore: 'Já efetuou esta rota {times} vez(es) anteriormente.',
    routesDoneHeading: 'Rotas já efetuadas',
    lastTime: 'Última vez',
    allReportsHeading: 'Histórico de escalas',
    addSpreadsheetBtn: '+ Adicionar Planilha',

    // Excel theme specific
    excelTitle: 'Microsoft Excel - VanShift_Escala.xlsx',
    excelFile: 'Ficheiro',
    excelEdit: 'Editar',
    excelView: 'Ver',
    excelInsert: 'Inserir',
    excelFormat: 'Formatar',
    excelTools: 'Ferramentas',
    excelData: 'Dados',
    excelHelp: 'Ajuda',
    excelFormulaLabel: 'fx',
    excelReady: 'Pronto',
    excelSheet1: 'Turno_Hoje',
    excelSheet2: 'Estatísticas',
    excelSheet3: 'Carregar_Escala',
  },
}

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('vanshift:theme') || 'neon')
  const [lang, setLangState] = useState(() => localStorage.getItem('vanshift:lang') || 'en')
  const [driver, setDriverState] = useState(() => localStorage.getItem('vanshift:driver') || '')
  const [allDrivers, setAllDrivers] = useState([])

  const setTheme = (t) => {
    setThemeState(t)
    localStorage.setItem('vanshift:theme', t)
  }

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem('vanshift:lang', l)
  }

  const setDriver = (d) => {
    setDriverState(d)
    localStorage.setItem('vanshift:driver', d)
  }

  const t = (key, params = {}) => {
    let str = TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v)
    }
    return str
  }

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        lang,
        setLang,
        driver,
        setDriver,
        allDrivers,
        setAllDrivers,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
