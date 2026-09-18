/**
 * Names of weekdays and months and the few fixed words the widgets print at runtime.
 *
 * They are not in `i18n/*.json`, because those files are for the editor and follow the language of vis-2, while the
 * weather widget has a `language` attribute of its own. The vis-1 widget set only knew en, de and ru here and
 * printed "undefined" for every other language; these tables cover all languages of vis-2.
 */

export type Lang = 'en' | 'de' | 'ru' | 'pt' | 'nl' | 'fr' | 'it' | 'es' | 'pl' | 'uk' | 'zh-cn';

export const LANGUAGES: Lang[] = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];

type Words = Record<Lang, string[]>;

/** Sunday first, like `Date.getDay()` */
const WEEKDAYS: Words = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    pt: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    nl: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'],
    fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    it: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
    es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    pl: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
    uk: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'],
    'zh-cn': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
};

const WEEKDAYS_SHORT: Words = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    nl: ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'],
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    it: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
    es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    pl: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'],
    uk: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    'zh-cn': ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
};

/** January first, like `Date.getMonth()` */
const MONTHS: Words = {
    en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ],
    de: [
        'Januar',
        'Februar',
        'März',
        'April',
        'Mai',
        'Juni',
        'Juli',
        'August',
        'September',
        'Oktober',
        'November',
        'Dezember',
    ],
    ru: [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
    ],
    pt: [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
    ],
    nl: [
        'Januari',
        'Februari',
        'Maart',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Augustus',
        'September',
        'Oktober',
        'November',
        'December',
    ],
    fr: [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre',
    ],
    it: [
        'Gennaio',
        'Febbraio',
        'Marzo',
        'Aprile',
        'Maggio',
        'Giugno',
        'Luglio',
        'Agosto',
        'Settembre',
        'Ottobre',
        'Novembre',
        'Dicembre',
    ],
    es: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
    ],
    pl: [
        'Styczeń',
        'Luty',
        'Marzec',
        'Kwiecień',
        'Maj',
        'Czerwiec',
        'Lipiec',
        'Sierpień',
        'Wrzesień',
        'Październik',
        'Listopad',
        'Grudzień',
    ],
    uk: [
        'Січень',
        'Лютий',
        'Березень',
        'Квітень',
        'Травень',
        'Червень',
        'Липень',
        'Серпень',
        'Вересень',
        'Жовтень',
        'Листопад',
        'Грудень',
    ],
    'zh-cn': ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
};

/** The labels of the weather widget */
export type WeatherWord = 'High' | 'Low' | 'Wind' | 'Humidity' | 'Temperature';

const WEATHER_WORDS: Record<Lang, Record<WeatherWord, string>> = {
    en: { High: 'High', Low: 'Low', Wind: 'Wind', Humidity: 'Humidity', Temperature: 'Temperature' },
    de: { High: 'Höchste', Low: 'Niedrigste', Wind: 'Wind', Humidity: 'Luftfeuchte', Temperature: 'Temperatur' },
    ru: { High: 'Макс.', Low: 'Мин.', Wind: 'Ветер', Humidity: 'Влажность', Temperature: 'Температура' },
    pt: { High: 'Máx.', Low: 'Mín.', Wind: 'Vento', Humidity: 'Humidade', Temperature: 'Temperatura' },
    nl: { High: 'Max.', Low: 'Min.', Wind: 'Wind', Humidity: 'Luchtvochtigheid', Temperature: 'Temperatuur' },
    fr: { High: 'Max.', Low: 'Min.', Wind: 'Vent', Humidity: 'Humidité', Temperature: 'Température' },
    it: { High: 'Max.', Low: 'Min.', Wind: 'Vento', Humidity: 'Umidità', Temperature: 'Temperatura' },
    es: { High: 'Máx.', Low: 'Mín.', Wind: 'Viento', Humidity: 'Humedad', Temperature: 'Temperatura' },
    pl: { High: 'Maks.', Low: 'Min.', Wind: 'Wiatr', Humidity: 'Wilgotność', Temperature: 'Temperatura' },
    uk: { High: 'Макс.', Low: 'Мін.', Wind: 'Вітер', Humidity: 'Вологість', Temperature: 'Температура' },
    'zh-cn': { High: '最高', Low: '最低', Wind: '风', Humidity: '湿度', Temperature: '温度' },
};

/** Falls back to English for a language these tables do not know */
export function toLang(lang: string | undefined | null): Lang {
    return lang && (LANGUAGES as string[]).includes(lang) ? (lang as Lang) : 'en';
}

export function weekdayName(day: number, lang: string, short?: boolean): string {
    return (short ? WEEKDAYS_SHORT : WEEKDAYS)[toLang(lang)][day];
}

/** `month` is 0-based, like `Date.getMonth()` */
export function monthName(month: number, lang: string): string {
    return MONTHS[toLang(lang)][month];
}

export function weatherWord(word: WeatherWord, lang: string): string {
    return WEATHER_WORDS[toLang(lang)][word];
}
