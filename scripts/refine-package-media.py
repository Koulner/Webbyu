from pathlib import Path
import urllib.request, json, io
from PIL import Image
root=Path(__file__).resolve().parents[1]/'public/package-demos'
records=json.loads((root/'sources.json').read_text(encoding='utf-8'))
for name,number,source,creator in [('clear-home','35617574','cozy-living-room-interior-with-sunlit-window-35617574','Pexels; see source page'),('wood-workshop','8447803','carpenter-using-wooden-boards-and-tools-8447803','Los Muertos Crew')]:
 url=f'https://images.pexels.com/photos/{number}/pexels-photo-{number}.jpeg?auto=compress&cs=tinysrgb&w=1600'
 data=urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=60).read()
 Image.open(io.BytesIO(data)).convert('RGB').save(root/f'{name}.webp',quality=82)
 records=[r for r in records if r['file']!=f'{name}.webp']
 records.append({'file':f'{name}.webp','source':f'https://www.pexels.com/photo/{source}/','creator':creator,'download':url,'license':'https://www.pexels.com/license/'})
for r in records:
 if 'unsplash.com/photos/' in r['source']: r['source']=r['download'].split('?')[0]
for name in ['food-dish','food-room','food-table','wood-interior','wood-kitchen','clear-office']:
 p=root/f'{name}.webp'; im=Image.open(p); im.thumbnail((1600,1200)); im.save(p,quality=79)
(root/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')

