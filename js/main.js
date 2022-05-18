/* global Timeline, PopUp, Averigua */
async function main () {
  const timeline = new Timeline()
  const track = document.querySelector('#track')
  const start = document.querySelector('button#start')
  const mdres = await window.fetch('metadata.json')
  const mdata = await mdres.json()
  const pdict = {} // pop up dictionary

  const l = new PopUp({
    x: (window.screen.width / 2) - (400 / 2),
    y: (window.screen.height / 2) - (280 / 2),
    href: 'loading.html',
    name: 'loading'
  })
  console.log(l);
  const openCheck = l.open()
  if (openCheck === 'pop-ups-blocked') {
    document.querySelector('#pop-ups-blocked').style.display = 'block'
  } else {
    setTimeout(() => l.close(), 10)
    start.style.display = 'block'
  }

  // launch first popup (loading screen) when user presses start button
  start.addEventListener('click', () => {
    if (track.paused) {
      start.textContent = 'pause'
      track.play()
    } else {
      start.textContent = 'play'
      track.pause()
    }
  })

  timeline.load(mdata.keyframes, '#track')

  // setup the popups dictionary object
  mdata.popups.forEach(pop => {
    const first = timeline.getFirstKeyFrameFor(pop.id)
    const opts = { ...pop, ...first }
    pdict[pop.id] = new PopUp(opts)
  })

  // setup audio track + timeline logix
  track.src = mdata.track

  // play/pause any open popUps w/videos when track is toggled
  const toggleVideoPopUps = (state) => {
    for (const id in pdict) {
      const pop = pdict[id]
      if (pop.win && pop.win.window) {
        const vid = pop.win.document.querySelector('video')
        if (vid) vid[state]()
      }
    }
  }
  track.addEventListener('pause', () => toggleVideoPopUps('pause'))
  track.addEventListener('play', () => toggleVideoPopUps('play'))
  track.addEventListener('ended', () => { start.textContent = 'play' })

  track.addEventListener('timeupdate', () => {
    if (track.paused) {
      timeline.reset((popups) => {
        const ids = popups.map(p => p.id)
        for (const popup in pdict) {
          if (!ids.includes(pdict[popup].id)) pdict[popup].close()
        }
        popups.forEach(pop => {
          pdict[pop.id].open()
          pdict[pop.id].setSize(pop.width, pop.height)
          pdict[pop.id].moveTo(pop.x, pop.y)
        })
      })
    } else {
      // ----------------------------------- ANIMATE KEYFRAME ------------------
      timeline.update((popups) => {
        const showing = popups
          .sort((a, b) => parseFloat(a.z) - parseFloat(b.z)) // sort by zIndex
          .map(p => p.id)
        // hide any open widgets that shouldn't be open anymore
        for (const id in pdict) {
          const pop = pdict[id]
          if (!showing.includes(pop.id)) pop.close()
        }
        // open those that should be
        showing.forEach(id => {
          const pop = pdict[id]
          if (!showing.includes(pop.id)) pop.close()
          else {
            const opts = popups.filter(p => p.id === pop.id)[0]

            const x = (opts.type === 'exact')
              ? opts.x : (opts.x / opts.screen.width) * window.screen.availWidth
            const y = (opts.type === 'exact')
              ? opts.y : (opts.y / opts.screen.height) * window.screen.availHeight
            const w = (opts.type === 'exact')
              ? opts.width : (opts.width / opts.screen.width) * window.screen.availWidth
            const h = (opts.type === 'exact')
              ? opts.height : (opts.height / opts.screen.height) * window.screen.availHeight

            pop.setSize(w, h)

            if (opts.ease !== 'none') {
              pop.open()
              pop.tweenTo(x, y, 0.5, opts.ease)
            } else {
              pop.moveTo(x, y)
              pop.open()
            }
          }
        })
      })
    }
  })
}

if (Averigua.isMobile()) {
  document.querySelector('#mobile-disclaimer').style.display = 'block'
} else if (Averigua.browserInfo().name !== 'Chrome') {
  document.querySelector('#chrome-disclaimer').style.display = 'block'
} else {
  main()
}
