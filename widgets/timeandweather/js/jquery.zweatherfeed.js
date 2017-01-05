/**
 * Plugin: jquery.zWeatherFeed
 * 
 * Version: 1.2.1
 * (c) Copyright 2011-2013, Zazar Ltd
 * 
 * Description: jQuery plugin for display of Yahoo! Weather feeds
 * 
 * History:
 * 1.2.1 - Handle invalid locations
 * 1.2.0 - Added forecast data option
 * 1.1.0 - Added user callback function
 *         New option to use WOEID identifiers
 *         New day/night CSS class for feed items
 *         Updated full forecast link to feed link location
 * 1.0.3 - Changed full forecast link to Weather Channel due to invalid Yahoo! link
	   Add 'linktarget' option for forecast link
 * 1.0.2 - Correction to options / link
 * 1.0.1 - Added hourly caching to YQL to avoid rate limits
 *         Uses Weather Channel location ID and not Yahoo WOEID
 *         Displays day or night background images
 *
 **/

/* If used custom mode
    update widget as follow:
    $wid.weatherfeed('', 'update', {
         "units": {
            "distance": "km",
            "pressure": "mb",
            "speed": "km/h",
            "temperature": "C"
        },
        "location": {
            "city": "Karlsruhe"
        },
        "wind": {
            "chill": "66",
            "direction": "255",
            "speed": "11.27"
        },
        "atmosphere": {
            "humidity": "71"
        },
        "image": {
            "url": "http://l.yimg.com/a/i/brand/purplelogo//uh/us/news-wea.gif"
        },
        "item": {
            "condition": {
                "code": "26",
                "temp": "19",
                "text": "Cloudy"
            },
            "forecast": [
                {
                    "code": "12",
                    "high": "20",
                    "low": "14",
                    "text": "Rain"
                },
                {
                    "code": "39",
                    "high": "21",
                    "low": "13",
                    "text": "Scattered Showers"
                },
                {
                    "code": "4",
                    "high": "22",
                    "low": "15",
                    "text": "Thunderstorms"
                },
                {
                    "code": "28",
                    "high": "23",
                    "low": "13",
                    "text": "Mostly Cloudy"
                },
                {
                    "code": "4",
                    "high": "24",
                    "low": "15",
                    "text": "Thunderstorms"
                },
                {
                    "code": "47",
                    "high": "23",
                    "low": "16",
                    "text": "Scattered Thunderstorms"
                },
                {
                    "code": "30",
                    "high": "23",
                    "low": "16",
                    "text": "Partly Cloudy"
                }
            ]
        }
    });
*/
(function($){
	"use strict";

    // Translation function. DONT make ARRAY. Numbers are important
    var _tt = []; {
        _tt[0]    = {'en':'Tornado',            'de': 'Tornado',            'ru': 'Торнадо - сиди дома!'};
        _tt[1]    = {'en':'Tropical storm',     'de': 'Tropischer Sturm', 			'ru': 'Тропический шторм'};
        _tt[2]    = {'en':'Hurricane',          'de': 'Hurrikan', 					'ru': 'Ураган'};
        _tt[3]    = {'en':'Severe thunderstorms', 'de': 'Starke Gewitter',         'ru': 'Сильная непогода'};
        _tt[4]    = {'en':'Thunderstorms',      'de': 'Gewitter', 					'ru': 'Грозы'};
        _tt[5]    = {'en':'Mixed rain and snow', 'de' : 'Regen mit Schnee', 	    'ru': 'Дождь со снегом'};
        _tt[6]    = {'en':'Mixed rain and sleet', 'de' : 'Regen mit Graupel',	    'ru': 'Дождь с градом'};
        _tt[7]    = {'en':'Mixed snow and sleet', 'de' : 'Schnee mit Graupel', 	    'ru': 'Снег с градом'};
        _tt[8]    = {'en':'Freezing drizzle',   'de' : 'Eisnieselregen', 			'ru': 'Изморозь'};
        _tt[9]    = {'en':'Drizzle',            'de' : 'Nieselregen', 				'ru': 'Моросящий дождь'};
        _tt[10]   = {'en':'Freezing rain',      'de': 'Eisregen', 					'ru': 'Ледяной дождь'};
        _tt[11]   = {'en':'Showers',            'de': 'Regenschauer', 				'ru': 'Ливень'};
        _tt[12]   = {'en':'Showers',            'de': 'Regenschauer',				'ru': 'Ливень'};
        _tt[13]   = {'en':'Snow flurries',      'de': 'Schneetreiben', 				'ru': 'Снегопад'};
        _tt[14]   = {'en':'Light snow showers', 'de': 'Leichter Schneeregen',  'ru': 'Небольшой дождь со снегом'};
        _tt[15]   = {'en':'Bowing snow',        'de': 'Schneeb&ouml;en',                 'ru': 'Снег'};
        _tt[16]   = {'en':'Snow',               'de': 'Schnee', 					'ru': 'Снег'};
        _tt[17]   = {'en':'Hail',               'de': 'Hagel', 						'ru': 'Град'};
        _tt[18]   = {'en':'Sleet',              'de': 'Graupel', 					'ru': 'Мелкий град'};
        _tt[19]   = {'en':'Dust',               'de':'Diesig',                      'ru': 'Пыльно'};
        _tt[20]   = {'en':'Foggy',              'de':'Neblig', 						'ru': 'Туманно'};
        _tt[21]   = {'en':'Haze',               'de':'Dunst',						'ru': 'Туман'};
        _tt[22]   = {'en':'Smoky',              'de':'Qualmig', 					'ru': 'Задымление'};
        _tt[23]   = {'en':'Blustery',           'de':'St&uuml;rmisch', 					'ru': 'Порывистый ветер'};
        _tt[24]   = {'en':'Windy',              'de':'Windig', 						'ru': 'Ветрянно'};
        _tt[25]   = {'en':'Cold',               'de':'Kalt', 						'ru': 'Холодно'};
        _tt[26]   = {'en':'Cloudy',             'de':'Wolkig',                      'ru': 'Облачно'};
        _tt[27]   = {'en':'Mostly cloudy (night)', 'de':'&Uuml;berwiegend wolkig (Nacht)',  'ru': 'В основном облачно'};
        _tt[28]   = {'en':'Mostly cloudy (day)', 'de':'&Uuml;berwiegend wolkig (Tag)',    'ru': 'В основном облачно'};
        _tt[29]   = {'en':'partly cloudy (night)', 'de':'Teilweise wolkig (Nacht)', 	    'ru': 'Местами облачно'};
        _tt[30]   = {'en':'partly cloudy (day)', 'de':'Teilweise wolkig (Tag)', 		    'ru': 'Приемущественно солнечно'};
        _tt[31]   = {'en':'clear (night)',      'de':'Klare Nacht', 						'ru': 'Ясно'};
        _tt[32]   = {'en':'sunny',              'de':'Sonnig', 						'ru': 'Солнечно'};
        _tt[33]   = {'en':'fair (night)',       'de': 'Sch&ouml;nwetter (Nacht)', 			'ru': 'Прекрасная погода'};
        _tt[34]   = {'en':'fair (day)',         'de': 'Sch&ouml;nwetter (Tag)', 			'ru': 'Прекрасная погода'};
        _tt[35]   = {'en':'mixed rain and hail', 'de': 'Regen mit Hagel', 		    'ru': 'Снег с градом'};
        _tt[36]   = {'en':'hot',                'de': 'Hei&szlig;',                  'ru': 'Жарко'};
        _tt[37]   = {'en':'isolated thunderstorms', 'de': 'Gebietsweise Gewitter',  'ru': 'Одиночные грозы'};
        _tt[38]   = {'en':'scattered thunderstorms', 'de': 'Vereinzelte Gewitter',  'ru': 'Грозы'};
        _tt[39]   = {'en':'scattered thunderstorms', 'de': 'Vereinzelte Gewitter',  'ru': 'Грозы'};
        _tt[40]   = {'en':'scattered showers',  'de': 'Vereinzelter Regen',           'ru': 'Дождь'};
        _tt[41]   = {'en':'heavy snow',         'de':'Starker Schneefall', 			'ru': 'Сильный снегопад'};
        _tt[42]   = {'en':'scattered snow showers', 'de': 'Vereinzelter Schneeregen', 'ru': 'Ливень с дождем'};
        _tt[43]   = {'en':'heavy snow',         'de':'Starker Schneefall', 			'ru': 'Сильный снегопад'};
        _tt[44]   = {'en':'partly cloudy',      'de':'Teilweise wolkig', 			'ru': 'Переменная облачность'};
        _tt[45]   = {'en':'thundershowers',     'de':'Gewitterschauer', 			'ru': 'Штормовой дождь'};
        _tt[46]   = {'en':'snow showers',       'de': 'Schneeregen', 				'ru': 'Снег с дождем'};
        _tt[47]   = {'en':'isolated thundershowers', 'de': 'Gebietsweise Gewitterschauer', 'ru': 'Местами грозы'};
        _tt[100]  = {code: 39, 'en':'scattered thunderstorms', 'de': 'Vereinzelte Gewitter',   'ru': 'Грозы'};
        _tt[101]  = {code: 32, 'en':'sunny',    'de':'Sonnig', 						'ru': 'Солнечно'};
        _tt[3200] = {'en':'not available',      'de': '', 							'ru': ''};
    }

    function _translate(word, lang) {
        if (word === undefined || word == null || word == "")
            return '';

        if (lang == 'de') {
            // If date
            if (word.length > 1 && word[0] >= '0' && word[0] <= '9') {
                word = word.replace ('Jan', 'Januar');
                word = word.replace ('Feb', 'Februar');
                word = word.replace ('Mar', 'M&auml;rz');
                word = word.replace ('Apr', 'April');
                word = word.replace ('Mai', 'Mai');
                word = word.replace ('Jun', 'Juni');
                word = word.replace ('Jul', 'Juli');
                word = word.replace ('Aug', 'August');
                word = word.replace ('Sep', 'September');
                word = word.replace ('Oct', 'Oktober');
                word = word.replace ('Nov', 'November');
                word = word.replace ('Dec', 'Dezember');
                return word;
            }

            if (word == 'High')
                return 'H&ouml;chste';
            if (word == 'Low')
                return 'Niedrigste';
            if (word == 'Wind')
                return 'Wind';
            if (word == 'Humidity')
                return 'Luftfeuchte';
            if (word == 'Visibility')
                return 'Sichtweite';
            if (word == 'Sunrise')
                return 'Sonnenaufgang';
            if (word == 'Sunset')
                return 'Sonnenuntergang';
            if (word == 'City not found')
                return 'Stadt ist nicht gefunden';
            if (word == 'Full forecast')
                return 'Volle Vorhersage';
            if (word == 'Read full forecast')
                return 'Sehe volle Vorhersage';
            if (word == 'Mon')
                return 'Montag';
            if (word == 'Tue')
                return 'Dienstag';
            if (word == 'Wed')
                return 'Mittwoch';
            if (word == 'Thu')
                return 'Donnerstag';
            if (word == 'Fri')
                return 'Freitag';
            if (word == 'Sat')
                return 'Samstag';
            if (word == 'Sun')
                return 'Sonntag';
        }
        if (lang == 'ru') {
            // If date
            if (word.length > 1 && word[0] >= '0' && word[0] <= '9') {
                word = word.replace ('Jan', 'Январь');
                word = word.replace ('Feb', 'Февраль');
                word = word.replace ('Mar', 'Март');
                word = word.replace ('Apr', 'Апрель');
                word = word.replace ('Mai', 'Май');
                word = word.replace ('Jun', 'Июнь');
                word = word.replace ('Jul', 'Июль');
                word = word.replace ('Aug', 'Август');
                word = word.replace ('Sep', 'Сентябрь');
                word = word.replace ('Oct', 'Октябрь');
                word = word.replace ('Nov', 'Ноябрь');
                word = word.replace ('Dec', 'Декабрь');
                return word;
            }

            if (word == 'High')
                return 'Макс.';
            if (word == 'Temperature')
                return 'Температура';
            if (word == 'Low')
                return 'Мин.';
            if (word == 'Wind')
                return 'Ветер';
            if (word == 'Humidity')
                return 'Влажность';
            if (word == 'Visibility')
                return 'Видимость';
            if (word == 'Sunrise')
                return 'Восход';
            if (word == 'Sunset')
                return 'Закат';
            if (word == 'City not found')
                return 'Город не найден';
            if (word == 'Full forecast')
                return 'Полный прогноз';
            if (word == 'Read full forecast')
                return 'См. полный прогноз';
            if (word == 'Mon')
                return 'Понедельник';
            if (word == 'Tue')
                return 'Вторник';
            if (word == 'Wed')
                return 'Среда';
            if (word == 'Thu')
                return 'Четверг';
            if (word == 'Fri')
                return 'Пятница';
            if (word == 'Sat')
                return 'Суббота';
            if (word == 'Sun')
                return 'Воскресение';
        }
        return word;
    }

    function findCode(text) {
        text = text.toLowerCase();
        for (var i = 0; i < _tt.length && i < 200; i++) {
            if (!_tt[i]) continue;
            var de = _tt[i].de.toLowerCase().replace(/&ouml;/, 'ö').replace(/&uuml;/, 'ü').replace(/&szlig;/, 'ß');
            if (_tt[i].en.toLowerCase() === text || de=== text || _tt[i].ru.toLowerCase() === text) {
                return _tt[i].code !== undefined ? _tt[i].code : i;
            }
        }
        for (var i = 0; i < _tt.length && i < 200; i++) {
            if (!_tt[i]) continue;
            var de = _tt[i].de.toLowerCase().replace(/&ouml;/, 'ö').replace(/&uuml;/, 'ü').replace(/&szlig;/, 'ß');
            if (_tt[i].en.toLowerCase().indexOf(text) !== -1 || de.indexOf(text) !== -1 || _tt[i].ru.toLowerCase().indexOf(text) !== -1) {
                return _tt[i].code !== undefined ? _tt[i].code : i;
            }
        }
        return null;
    }

    // Function to each feed item
    function _process(e, options) {
        var $e   = $(e);
        var row  = 'odd';
        var feed = $e[0].feed;
        if (!options) options = $e.data('options');

        $e.empty();
        if (options.width)  $e.css ({width:  options.width});
        if (options.height) $e.css ({height: options.height});

        var isShort = (options.width < 100);
        var html;

        // Check for invalid location
        if (feed.description !== 'Yahoo! Weather Error' && feed.wind) {
            // Format feed items
            var wd = feed.wind.direction;
            if (wd >= 348.75 && wd <= 360)    {
                wd = 'N';
            } else
            if (wd >= 0      && wd <  11.25)  {
                wd = 'N';
            } else
            if (wd >= 11.25  && wd <  33.75)  {
                wd = 'NNE';
            } else
            if (wd >= 33.75  && wd <  56.25)  {
                wd = 'NE';
            } else
            if (wd >= 56.25  && wd <  78.75)  {
                wd = 'ENE';
            } else
            if (wd >= 78.75  && wd <  101.25) {
                wd = 'E';
            } else
            if (wd >= 101.25 && wd <  123.75) {
                wd = 'ESE';
            } else
            if (wd >= 123.75 && wd <  146.25) {
                wd = 'SE';
            } else
            if (wd >= 146.25 && wd <  168.75) {
                wd = 'SSE';
            } else
            if (wd >= 168.75 && wd <  191.25) {
                wd = 'S';
            } else
            if (wd >= 191.25 && wd <  213.75) {
                wd = 'SSW';
            } else
            if (wd >= 213.75 && wd <  236.25) {
                wd = 'SW';
            } else
            if (wd >= 236.25 && wd <  258.75) {
                wd = 'WSW';
            } else
            if (wd >= 258.75 && wd <  281.25) {
                wd = 'W';
            } else
            if (wd >= 281.25 && wd <  303.75) {
                wd = 'WNW';
            } else
            if (wd >= 303.75 && wd <  326.25) {
                wd = 'NW';
            } else
            if (wd >= 326.25 && wd <  348.75) {
                wd = 'NNW';
            }
            var wf = feed.item.forecast[0];

            // Determine day or night image
            var wpd = feed.item.pubDate || (new Date().toString());
            var n   = wpd.indexOf(':');
            var tpb = _getTimeAsDate(wpd.substr(n - 2, 8));
            var tsr = feed.astronomy && feed.astronomy.sunrise ? _getTimeAsDate(feed.astronomy.sunrise) : null;
            var tss = feed.astronomy && feed.astronomy.sunset  ? _getTimeAsDate(feed.astronomy.sunset)  : null;
            var daynight;

            // Get night or day
            if (tsr === null) {
                var hh = new Date().getHours();
                daynight = (hh > 20 || hh < 7) ? 'night' : 'day';
            } else {
                if (tpb > tsr && tpb < tss) {
                    daynight = 'day';
                } else {
                    daynight = 'night';
                }
            }

            // Add item container
            html = '<div class="weatherItem ' + row + ' ' + daynight + '" style="';
            if (options.image) {
                if (feed.item.condition.code !== undefined && feed.item.condition.code !== null) {
                    html += 'background-image: url(http://l.yimg.com/a/i/us/nws/weather/gr/' + feed.item.condition.code + daynight.substring(0, 1) + '.png); background-repeat: no-repeat;';
                } else if (feed.item.condition.icon) {
                    html += 'background-image: url(' + feed.item.condition.icon + '); background-repeat: no-repeat;';
                } else {
                    var code = findCode(feed.item.condition.text);
                    if (code !== null) {
                        html += 'background-image: url(http://l.yimg.com/a/i/us/nws/weather/gr/' + code + daynight.substring(0, 1) + '.png); background-repeat: no-repeat;';
                    }
                }
            }
            html += ($(e).css('border-radius') ? 'border-radius: ' + $(e).css('border-radius') : '') + '"';
            html += '>';

            // Add item data
            html += '<div class="weatherCity">' + (options.city || feed.location.city) + '</div>';
            if (options.country) html += '<div class="weatherCountry">' + feed.location.country + '</div>';
            if (feed.item.condition.temp !== null) html += '<div class="weatherTemp">' + feed.item.condition.temp + '&deg;</div>';
            if (feed.item.condition.code !== null && _tt[feed.item.condition.code]) {
                html += '<div class="weatherDesc">' + (_tt[feed.item.condition.code][options.lang] || _tt[feed.item.condition.code]['en']) + '</div>';
            } else if (feed.item.condition.text !== null) {
                var code = findCode(feed.item.condition.text);
                if (code !== null) feed.item.condition.text = _tt[code][options.lang] || _tt[code]['en'];
                html += '<div class="weatherDesc">' + feed.item.condition.text + '</div>';
            }

            // Add optional data
            if (wf) {
                if (wf.high !== null && options.highlow && !isShort) html += '<div class="weatherRange">' + _translate('High', options.lang) + ': ' + wf.high + '&deg; ' + _translate('Low', options.lang) + ': ' + wf.low + '&deg;</div>';
                if (wf.low  !== null && options.highlow && isShort)  html += '<div class="weatherRange">' + wf.low + '&deg;-' + wf.high + '&deg;</div>';
            }
            if (feed.wind.speed                               !== null && options.wind     && !isShort) html += '<div class="weatherWind">'       + _translate('Wind',       options.lang) + ': ' + wd + ' ' + feed.wind.speed + _translate(feed.units.speed) + '</div>';
            if (feed.atmosphere && feed.atmosphere.humidity   !== null && options.humidity && !isShort) html += '<div class="weatherHumidity">'   + _translate('Humidity',   options.lang) + ': ' + feed.atmosphere.humidity + '%</div>';
            if (feed.atmosphere && feed.atmosphere.humidity   !== null && options.humidity && isShort)  html += '<div class="weatherHumidity">'   + feed.atmosphere.humidity + '%</div>';
            if (feed.atmosphere && feed.atmosphere.visibility !== null && options.visibility)           html += '<div class="weatherVisibility">' + _translate('Visibility', options.lang) + ': ' + feed.atmosphere.visibility + '</div>';
            if (feed.astronomy  && feed.astronomy.sunrise     !== null && options.sunrise)              html += '<div class="weatherSunrise">'    + _translate('Sunrise',    options.lang) + ': ' + feed.astronomy.sunrise + '</div>';
            if (feed.astronomy  && feed.astronomy.sunset      !== null && options.sunset)               html += '<div class="weatherSunset">'     + _translate('Sunset',     options.lang) + ': ' + feed.astronomy.sunset + '</div>';

            // Add item forecast data
            if (options.forecast && feed.item) {

                html += '<div class="weatherForecast">';

                var wfi = feed.item.forecast;

                for (var i = 0; i < wfi.length; i++) {
                    if (options.maxDays && (i + 1) > options.maxDays) break;

                    if (!wfi[i].date) {
                        var now = new Date();
                        now.setDate(now.getDate() + i);
                        wfi[i].date = now.toDateString();
                        wfi[i].day  = wfi[i].date.substring(0, 3);
                        wfi[i].date = wfi[i].date.substring(8, 11) + wfi[i].date.substring(4, 7) + wfi[i].date.substring(10);
                    }
                    if (wfi[i].code !== null && wfi[i].code !== undefined) {
                        html += '<div class="weatherForecastItem" style="background-image: url(http://l.yimg.com/a/i/us/nws/weather/gr/'+ wfi[i].code + 's.png); background-repeat: no-repeat;">';
                    } else if (wfi[i].icon) {
                        html += '<div class="weatherForecastItem" style="background-image: url(' + wfi[i].icon + '); background-repeat: no-repeat;">';
                    } else if (wfi[i].text) {
                        var code = findCode(wfi[i].text);
                        if (code !== null) {
                            html += '<div class="weatherForecastItem" style="background-image: url(http://l.yimg.com/a/i/us/nws/weather/gr/' + code + 's.png); background-repeat: no-repeat;">';
                        } else {
                            html += '<div class="weatherForecastItem">';
                        }
                    } else {
                        html += '<div class="weatherForecastItem">';
                    }

                    if (wfi[i].day)  html += '<div class="weatherForecastDay">'  + _translate(wfi[i].day,  options.lang, isShort) + '</div>';
                    if (wfi[i].date) html += '<div class="weatherForecastDate">' + _translate(wfi[i].date, options.lang, isShort) + '</div>';
                    if (wfi[i].code !== null && _tt[wfi[i].code]) {
                        html += '<div class="weatherForecastText">' + (_tt[wfi[i].code][options.lang] || _tt[wfi[i].code]['en']) + '</div>';
                    } else if (wfi[i].text) {
                        var code = findCode(wfi[i].text);
                        if (code !== null) wfi[i].text = _tt[code][options.lang] || _tt[code]['en'];
                        html += '<div class="weatherForecastText">' + _(wfi[i].text) + '</div>';
                    }
                    if (isShort) {
                        if (wfi[i].low !== null) html += '<div class="weatherForecastRange">' + wfi[i].low + '&deg;-' + wfi[i].high + '&deg;</div>';
                    } else {
                        if (wfi[i].low !== null) html += '<div class="weatherForecastRange">' + _translate('Temperature', options.lang) + ': '+ wfi[i].low + '&deg;-' + wfi[i].high + '&deg;</div>';
                    }
                    html += '</div>';

                }

                html += '</div>'
            }

            if (options.link) html += '<div class="weatherLink"><a href="'+ feed.link +'" target="'+ options.linktarget +'" title="'+_translate('Read full forecast', options.lang)+'">'+_translate('Full forecast', options.lang)+'</a></div>';

        } else {
            html = '<div class="weatherItem ' + row + '">';
            html += '<div class="weatherError">' + _translate('City not found', options.lang) + '</div>';
        }

        html += '</div>';

        // Alternate row classes
        if (row == 'odd') {
            row = 'even';
        } else {
            row = 'odd';
        }

        $e.append(html);
        if (typeof options.rendered === 'function') options.rendered();

        if (options.resizable && !$e.data('inited')) {
            $e.data('inited', true);

            $e.resizable().resize(function() {
                var timer = $e.data('timer');

                if (timer) clearTimeout(timer);
                $e.data('timer', setTimeout ( function () {
                    $e.data('timer', null);
                    options.width  = $e.width();
                    options.height = $e.height();
                    _process($e[0], options);
                }, 1000));
            });
        }
    }

    // Get time string as date
    function _getTimeAsDate (t) {
        return new Date(new Date().toDateString() + ' ' + t);
    }

	$.fn.weatherfeed = function (locations, _options, fn) {
        if (typeof _options === 'string') {
            if (_options === 'update') {
                return this.each(function () {
                    this.feed = fn;
                    _process(this);
                });
            }
            return;
        }

		// Set plugin defaults
		var defaults = {
			unit:       'c',
			image:      true,
			country:    false,
			highlow:    true,
			wind:       true,
			humidity:   false,
			visibility: false,
			sunrise:    false,
			sunset:     false,
			forecast:   false,
			link:       true,
			showerror:  true,
			linktarget: '_blank',
			woeid:      false,
			lang:       'en',
			update:     60 // minutes
		};  		
		var options = $.extend(defaults, _options);

		// Functions
		return this.each(function (i, e) {
			var $e = $(e);
            $e.data('options', options);
            console.log($e.attr('id'));

			// Add feed class to user div
			if (!$e.hasClass('weatherFeed')) $e.addClass('weatherFeed');

			// Check and append locations
			if (!options.custom && !$.isArray(locations)) return false;

            if (!options.custom) {
                var _requestData = function () {
                    var count = locations.length;
                    if (count > 10) count = 10;

                    var locationid = '';

                    for (var i = 0; i < count; i++) {
                        if (locationid != '') locationid += ',';
                        locationid += "'" + locations[i] + "'";
                    }

                    // Cache results for an hour to prevent overuse
                    var now = new Date();

                    // Select location ID type
                    var queryType = options.woeid ? 'woeid' : 'location';

                    // Create Yahoo Weather feed API address
                    var query = "select * from weather.forecast where " + queryType + " in (" + locationid + ") and u='" + options.unit + "'";
                   
					var protocol = window.location.protocol;
					if (protocol !== 'http:' && protocol !== 'https:') protocol = 'https:';
                    var api = protocol + '//query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + '&rnd=' + now.getFullYear() + now.getMonth() + now.getDay() + now.getHours() +'&format=json&callback=?';

                    // Send request
                    $.ajax({
                        type:    'GET',
                        url:      api,
                        dataType: 'json',
                        context:  $e,
                        success:  function (data) {
                            if (data.query && data.query.results) {

                                this[0].feed = data.query.results.channel;

                                if (data.query.results.channel && data.query.results.channel.length > 0 ) {
                                    // Multiple locations
                                    var result = data.query.results.channel.length;
                                    for (var i = 0; i < result; i++) {
                                        // Create weather feed item
                                        _process(e, options);
                                    }
                                } else {
                                    // Single location only
                                    _process(e, options);
                                }

                                // Optional user callback function
                                if ($.isFunction(fn)) fn.call(this,$e);
                            } else {
                                console.error('Got answer: ' + JSON.stringify(data));
                                if (options.showerror) $e.html('<p>Weather information unavailable</p>');
                            }
                        },
                        error:    function (err) {
                            console.error('Got error: ' + JSON.stringify(err));
                            if (options.showerror) $e.html('<p>Weather request failed</p>');
                        }
                    });
                };

                this.startUpdater = function () {
                    _requestData();

                    if (options.update > 0){
                        var that = this;
                        setTimeout(function () {
                            that.startUpdater();
                        }, options.update * 60000);
                    }
                };
            }

			if (this.startUpdater) this.startUpdater();
		});
	};

})(jQuery);
