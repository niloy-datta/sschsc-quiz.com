from html.parser import HTMLParser
import urllib.request

url = 'https://en.lekhaporabd.net/hsc-physics-2nd-paper-mcq-questions-and-answers-2024/'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://google.com/',
}
req = urllib.request.Request(url, headers=headers)
resp = urllib.request.urlopen(req)
html = resp.read().decode('utf-8', 'ignore')

class ImgParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.imgs = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'img':
            d = dict(attrs)
            src = d.get('src') or d.get('data-src') or d.get('data-lazy-src')
            if src:
                self.imgs.append(src)

parser = ImgParser()
parser.feed(html)
print('found', len(parser.imgs), 'images')
for src in parser.imgs:
    print(src)
