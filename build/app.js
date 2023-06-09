class eventTimer {

    // GMT+0 base
    eventTimeList = {
        Teq: ["00:00", "03:00", "07:00", "11:30", "16:00", "19:00"],
        TT: ["01:00", "04:00", "08:00", "12:30", "17:00", "20:00"],
        LLA: "even:20",
        Drakkar: "odd:05",
        DS: "odd:00",
        VB: "even:10"
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
            return a.getAttribute("data-start-at") > b.getAttribute("data-start-at");
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


const cards = document.querySelectorAll('#card-container>div');
init();
const countdown = setInterval(() => {
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
        }
        else if ((now - ts) <= 180000) {
            card.querySelector('div:nth-child(2)').textContent = "ACTIVE";
        } else {
            changed = true;
            setStartTime(card, moment(), et.getTimeList(card.getAttribute('name')));
            hightlightNext(card);

            if (card.getAttribute('name') == 'LLA')
                highlightLLALoc();
        }
    }
    if (changed)
        sortCards(cards);
}, 1000);
