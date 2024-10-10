class eventTimer {

    // GMT+0 base
    eventTimeList = {
        Teq: ["00:00", "03:00", "07:00", "11:30", "16:00", "19:00"],
        TT: ["01:00", "04:00", "08:00", "12:30", "17:00", "20:00"],
        LLA: "even:20",
        Drakkar: "odd:05",
        DS: "odd:00",
        VB: "even:10",
        Skywatch: "odd:00",
        Amnytas: "even:00",
        Convergences: ["01:30", "04:30", "07:30", "10:30", "13:30", "16:30", "19:30", "22:30"],
        AB: "even:40",
        DST: "odd:30"
    };

    getTimeList(event) {
        let date = moment().utc().format('DD MMM YYYY');
        let time = this.eventTimeList[event];
        if (!Array.isArray(time))
            time = this.stringtoTimeList(time);

        return time.map(t => {
            let dt = `${date} ${t}:00 +0000`;
            return moment(dt);
        });
    }

    stringtoTimeList(str) {
        const terms = str.split(":");
        return [...Array(12)].map((_, i) => {
            let h = terms[0] == 'odd' ? i * 2 + 1 : i * 2
            return `${h.toString().padStart(2, '0')}:${terms[1]}`;
        })
    }
}


const et = new (eventTimer);


const init = () => {
    initAlarm();

    const cards = document.querySelectorAll('#card-container>div');
    let now = moment();
    for (const card of cards) {
        let tl = et.getTimeList(card.getAttribute('name'));

        setStartTime(card, now, tl);
        updateTimeList(card, tl);
        hightlightNext(card);
        updateCardTitle(card);
    }
    sortCards(cards);

    for (let card of cards) {
        card.querySelector('input').addEventListener('click', event => {
            updateCardTitle(card)
            sortCards(cards);
        });
    }

    document.querySelectorAll('span[name="wp"]').forEach((ele) => {
        ele.addEventListener('click', (event) => {
            copyWP(event.target)
        })
    });

    highlightLLALoc();
};

const updateTimeList = (card, timeList) => {
    const ele = card.querySelector('[name="time-list"]')
    timeList.sort((a, b) => a.format('HH:mm') > b.format('HH:mm'))
        .map(t => t.format('HH:mm:ss'))
        .forEach(t => {
            ele.innerHTML += `<div class="text-sm py-px px-2 mr-3 tracking-wider">${t}</div>`;
        })
}

const setStartTime = (card, now, timeList) => {
    let next = null;
    for (let time of timeList) {
        let delay = moment(time).add(3, 'minute');
        if (now.isBefore(delay)) {
            next = time;
            break
        }
    }

    if (next == null)
        next = timeList[0].add(1, 'day');

    card.setAttribute('data-start-at', next.valueOf());
}

const sortCards = (cards) => {
    Array.from(cards).filter(card => card.querySelector('input:checked') != null)
        .forEach(card => card.style.order = 99);

    Array.from(cards).filter(card => card.querySelector('input:checked') == null)
        .sort((a, b) => {
            return a.getAttribute("data-start-at") > b.getAttribute("data-start-at") ? 1 : -1;
        })
        .forEach((ele, index) => {
            ele.style.order = index;
        });
}

const hightlightNext = (card) => {
    let next = moment(parseInt(card.getAttribute('data-start-at'))).format('HH:mm:ss');
    card.querySelectorAll('div[name="time-list"]>div')
        .forEach(item => {
            if (item.textContent == next)
                item.classList.add('badge')
            else
                item.classList.remove('badge');
        })
}

function updateCardTitle(card) {
    let title = card.querySelector('div:first-child');

    if (card.querySelector('input').checked) {
        title.classList.remove('bg-slate-600');
        title.classList.add('bg-lime-500');
    } else {
        title.classList.add('bg-slate-600');
        title.classList.remove('bg-lime-500');
    }
}

function copyWP(ele) {
    let input = document.querySelector('input#copy');
    let _alert = ele.parentElement.querySelector('span[name="alert"]')

    input.value = ele.textContent;
    input.select();
    navigator.clipboard.writeText(input.value);

    _alert.classList.remove('hidden');
    setTimeout(() => {
        _alert.classList.add('hidden');
    }, 1000);
}

function highlightLLALoc() {
    let card = document.querySelector('div[name="LLA"]');
    let time = card.getAttribute('data-start-at');
    let hour = moment(parseInt(time)).utc().format('h');
    let cur_index = (parseInt(hour) / 2) % 3;
    card.querySelectorAll('span[data-index').forEach((span) => {
        let data_index = span.getAttribute('data-index');
        if (data_index == cur_index) {
            span.classList.add('badge');
        } else {
            span.classList.remove('badge');
        }
    })
}

function updateCards() {
    const cards = document.querySelectorAll('#card-container>div');
    const now = moment().valueOf();
    let changed = false;

    for (let card of cards) {
        if (card.querySelector('input').checked) {
            card.querySelector('div:nth-child(2)').textContent = 'Completed';
            continue;
        }

        let ts = (card.getAttribute('data-start-at'));
        if (ts > now) {
            let remains = moment.utc((ts - now)).format('HH:mm:ss');
            card.querySelector('div:nth-child(2)').textContent = remains;

            if (localStorage.getItem('alarm') == 'on'
                && ts - now <= _alarmBefore[card.getAttribute('name')] * 1000
            )
                enableAlarm(card);
        }
        else if ((now - ts) <= 600000) {
            card.querySelector('div:nth-child(2)').textContent = "ACTIVE";
        } else {
            changed = true;
            setStartTime(card, moment(), et.getTimeList(card.getAttribute('name')));
            hightlightNext(card);

            // remove alarm done flag
            card.removeAttribute('data-alarm-done');

            if (card.getAttribute('name') == 'LLA')
                highlightLLALoc();
        }
    }

    if (changed)
        sortCards(cards);
}

function initAlarm() {
    let alarm = document.querySelector('svg#alarm');

    let isEnabled = localStorage.getItem('alarm');
    if (isEnabled == undefined) {
        isEnabled == 'off';
        localStorage.setItem('alarm', 'off');
    }

    if (isEnabled == 'on') {
        alarm.classList.remove('text-gray-400');
        alarm.classList.add('text-green-400');
    } else {
        alarm.classList.remove('text-green-400');
        alarm.classList.add('text-gray-400');
    }

    alarm.addEventListener('click', toggleAlarm);
}

function toggleAlarm() {
    let alarm = document.querySelector('svg#alarm');
    let isEnabled = localStorage.getItem('alarm');
    isEnabled = (isEnabled == 'on') ? 'off' : 'on';

    localStorage.setItem('alarm', isEnabled);

    alarm.classList.toggle('text-gray-400');
    alarm.classList.toggle('text-green-400');
}

function enableAlarm(card) {
    if (!card.hasAttribute('data-alarm-done')) {
        card.setAttribute('data-alarm-done', 'true');
        playSound(true);
        setTimeout(() => {
            playSound();
        }, 2000);
    }
}

function playSound(alert = false) {
    _audio.play()
        .catch(() => {
            if (alert)
                showAlarmAlert();
        })
}

function showAlarmAlert() {
    let toast = document.querySelector('#toast-warning');
    console.log(toast);
    toast.classList.remove('hidden', 'opacity-0');
    toast.classList.add('slidein');
}


let _audio = new Audio('build/mario.mp3');
let _alarmBefore = {
    'Teq': 600, // 10 mins
    'LLA': 180,
    'TT': 600,
    'Drakkar': 180,
    'DS': 180,
    'VB': 180
};

init();
updateCards();
setInterval(updateCards, 1000);