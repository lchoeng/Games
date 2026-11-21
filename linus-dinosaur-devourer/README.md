# Linus: Dinosaur Devourer

A Kirby-style side-scrolling platformer starring Linus. Inhale dinosaurs, swallow them to copy their powers, and beat six giant bosses across six worlds.

**Play:** open `index.html` in any browser. It's a single self-contained file, built for iPhone and iPad in landscape, and keyboard works too.

## Controls

| Action | Touch | Keyboard |
|---|---|---|
| Move | ◀ ▶ | Arrow keys / A D |
| Crouch, enter doors | ▼ | Down / S |
| Jump (tap twice to double jump, hold to float) | JUMP | Space / Z / Up |
| Inhale (hold); spit when your mouth is full | INHALE | X / J |
| Power attack; swallow to copy a power | POWER | C / K |
| Pause | ❚❚ | P / Esc |

Crouch + jump = slide. ▼ + POWER = each power's second move.

## Copy powers

| Dinosaur | Power |
|---|---|
| Mosasaurus | Water blast, fast swimming |
| T-Rex | Fire breath (▼ = bite) |
| D-Rex | Smash charge (▼ in the air = ground stomp) |
| Indominus Rex | Claw slash (▼ = camouflage) |
| Therizinosaurus | Giant claws + claw wave, cuts vines |
| Sarcosuchus | Croc chomp, water launch |

## Worlds

1. Jungle — Giant T-Rex (weak to Mosasaurus)
2. Forest — Giant Therizinosaurus (weak to T-Rex)
3. Desert — Giant D-Rex (weak to Mosasaurus)
4. Arctic — Giant Mosasaurus (weak to T-Rex)
5. Beach — Enormous Sarcosuchus (weak to D-Rex)
6. City — Giant Indominus Rex (weak to Therizinosaurus)

Each world has 4 stages and a boss stage, plus a secret bonus room behind a door in stages 2 and 4. There are 30 golden dinosaurs to find. Progress saves in the browser.

## Editing

The game is plain JavaScript with no dependencies.

- `src/` — game code (core, audio, art, levels, gameplay, bosses, rendering, menus)
- `sprites/` — Linus and dinosaur cutouts, plus the hero name and save slot in `sprites.js`, embedded as base64 images
- `shell.html` — the HTML page the script goes into

After changing anything, rebuild `index.html` with:

```
python3 build.py
```
