"""Build index.html: embeds the head sprites into src/game.html."""
import base64, io, os
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
def b64(name):
    buf = io.BytesIO(); Image.open(os.path.join(here, 'sprites', name)).save(buf, 'WEBP', quality=88, method=6)
    return base64.b64encode(buf.getvalue()).decode()
s = open(os.path.join(here, 'src', 'game.html')).read()
s = s.replace('%%HAPPY%%', b64('head_happy.png')).replace('%%EAT%%', b64('head_eat.png'))
open(os.path.join(here, 'index.html'), 'w').write(s)
print('built index.html', len(s))
