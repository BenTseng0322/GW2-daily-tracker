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
    }
    sortCards(cards);
};

const updateTimeList = (card, timeList) => {
    const ele = card.querySelector('[name="time-list"]')
    timeList.sort((a, b) => a.format('HH:mm') > b.format('HH:mm'))
        .map(t => t.format('HH:mm:ss'))
        .forEach(t => {
            ele.innerHTML += `<div class="text-sm py-1 px-2 mr-3 tracking-wider">${t}</div>`;
        })
}

const setStartTime = (card, now, timeList) => {
    let next = null;
    for (time of timeList) {
        if (now.isBefore(time)) {
            next = time;
            break
        }
    }

    if (next == null)
        next = time[0].add(1, 'day');

    card.setAttribute('data-start-at', next.valueOf());
}

const sortCards = (cards) => {
    Array.from(cards)
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

init();

const cards = document.querySelectorAll('#card-container>div');
const countdown = setInterval(() => {
    const now = moment().valueOf();
    let changed = false;

    for (let card of cards) {
        let ts = (card.getAttribute('data-start-at'));
        if (ts > now) {
            let remains = moment.utc((ts - now)).format('HH:mm:ss');
            card.querySelector('div:nth-child(2)').textContent = remains;
        }
        else if ((now - ts) <= 180) {
            card.querySelector('div:nth-child(2)').textContent = "ACTIVE";
        } else {
            setStartTime(card, moment(), et.getTimeList(card.getAttribute('name')));
            hightlightNext(card);
            changed = true;
        }
    }
    if (changed)
        sortCards(cards);
}, 1000);
