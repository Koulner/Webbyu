"""One-time asset preparation; no network requests are made by the demo websites."""
from pathlib import Path
import concurrent.futures
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'package-demos'
PHOTOS = {
    'clear-home': '1484154218962-a197022b5858',
    'clear-office': '1497366754035-f200968a6e72',
    'wood-workshop': '1504917595217-d4dc5ebe6122',
    'wood-interior': '1600210492486-724fe5c67fb0',
    'wood-kitchen': '1556912172-45b7abe8b7e1',
    'food-room': '1517248135467-4c7edcad34c4',
    'food-table': '1414235077428-338989a2e8c0',
    'food-dish': '1555939594-58d7cb561ad1',
}

def photo(item):
    name, photo_id = item
    url = f'https://images.unsplash.com/photo-{photo_id}?w=1600&q=85&fit=crop&fm=webp'
    request = urllib.request.Request(url, headers={'User-Agent': 'Webbyu demo asset preparation'})
    data = urllib.request.urlopen(request, timeout=60).read()
    (ROOT / f'{name}.webp').write_bytes(data)
    return {'file': f'{name}.webp', 'source': f'https://unsplash.com/photos/{photo_id}', 'download': url, 'license': 'https://unsplash.com/license', 'bytes': len(data)}

if __name__ == '__main__':
    ROOT.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        records = list(pool.map(photo, PHOTOS.items()))
    video_url = 'https://videos.pexels.com/video-files/1858094/1858094-hd_1080_1920_30fps.mp4'
    request = urllib.request.Request(video_url, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(request, timeout=60).read()
    (ROOT / 'restaurant-source.mp4').write_bytes(data)
    records.append({'file': 'restaurant.mp4', 'source': 'https://www.pexels.com/video/chef-cooking-in-front-of-customer-1858094/', 'creator': 'Rene Terp', 'download': video_url, 'license': 'https://www.pexels.com/license/', 'source_bytes': len(data), 'processing': '720px high, H.264, no audio; poster extracted from film'})
    (ROOT / 'sources.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'photos': len(PHOTOS), 'video_bytes': len(data)}))
