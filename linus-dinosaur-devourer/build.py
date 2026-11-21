import pathlib
root=pathlib.Path(__file__).resolve().parent
order=['core.js','audio.js','art.js','level.js','game.js','boss.js','render.js','ui.js']
js=open(root/'sprites'/'sprites.js').read()+'\n'+open(root/'sprites'/'dinos.js').read()+'\n'+open(root/'sprites'/'dinos2.js').read()+'\n'+'\n'.join((root/'src'/f).read_text() for f in order)
html=(root/'shell.html').read_text().replace('/*SCRIPT*/',js)
(root/'index.html').write_text(html)
print(len(html))
