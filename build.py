#!/usr/bin/env python3
"""Baut die Lochkamera-Seiten aus src/ zu eigenständigen HTML-Dateien (offline lauffähig).

Ausgabe in dist/:
  index.html                 Startseite
  lochkamera_3d/*.html       Fassung mit 3D-Animationen (three.js eingebettet)
  lochkamera/*.html          einfache 2D-Fassung

Textquelle für beide Fassungen ist pages/<seite>/body.html. Darin:
  <!--@3d--> nur 3D <!--@2d--> nur 2D <!--@end-->
"""
import os, re, sys

HIER = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HIER, 'src')
DIST = os.path.join(HIER, 'dist')

SEITEN = ['0_Uebersicht', '1_Unschaerfe', '2_Licht_buendeln', '3_Licht_durch_Glas',
          '4_Brechung', '5_Experimente', '6_Bildentstehung']
OHNE_3D = {'5_Experimente'}          # Seiten ohne WebGL-Szene
NAMEN = ['Übersicht', 'Unschärfe', 'Licht bündeln', 'Licht durch Glas', 'Brechung', 'Experimente', 'Bildentstehung']
# Speicher-Präfixe wie im Original (nicht ändern, sonst gehen Eingaben verloren)
PREFIX = {1: 'lk1', 2: 'lk2', 3: 'lk3g', 4: 'lk3', 5: 'lk4', 6: 'lk5'}
# Felder, die erst per JavaScript entstehen (für die Fortschrittsanzeige)
EXTRA_FELDER = {2: 18, 6: 7}


def lies(*teile):
    with open(os.path.join(SRC, *teile), encoding='utf8') as f:
        return f.read()


def fassung(text, ist3d):
    """Bedingte Blöcke auflösen."""
    muster = re.compile(r'<!--@3d-->\n?(.*?)<!--@2d-->\n?(.*?)<!--@end-->\n?', re.S)
    return muster.sub(lambda m: m.group(1) if ist3d else m.group(2), text)


def navigation(seite, ist3d):
    i = SEITEN.index(seite)
    links = ['<a href="../index.html">Start</a>']
    for k, s in enumerate(SEITEN):
        text = 'Übersicht' if k == 0 else str(k)
        attr = ' class="cur" aria-current="page"' if k == i else ''
        if k in PREFIX:
            body = fassung(lies('pages', s, 'body.html'), ist3d)
            n = len(re.findall(r'data-save="', body)) + EXTRA_FELDER.get(k, 0)
            attr += ' data-prefix="%s" data-n="%d"' % (PREFIX[k], n)
        titel = NAMEN[k] if k == 0 else 'Station %d: %s' % (k, NAMEN[k])
        links.append('<a href="%s.html"%s title="%s">%s</a>' % (s, attr, titel, text))
    anders = ('../lochkamera/%s.html' % seite, 'einfache Fassung (2D)') if ist3d else \
             ('../lochkamera_3d/%s.html' % seite, '3D-Fassung')
    links.append('<span class="sep"></span><a class="alt" href="%s">⇄ %s</a>' % anders)
    return '<nav class="lknav" aria-label="Stationen">' + ''.join(links) + '</nav>'


def blaettern(seite):
    i = SEITEN.index(seite)
    teile = []
    if i > 0:
        teile.append('<a href="%s.html">← %s</a>' % (SEITEN[i - 1], 'Übersicht' if i == 1 else 'Station %d' % (i - 1)))
    else:
        teile.append('<span></span>')
    if i < len(SEITEN) - 1:
        teile.append('<a class="next" href="%s.html">Weiter: Station %d – %s →</a>' % (SEITEN[i + 1], i + 1, NAMEN[i + 1]))
    return '<div class="pager">' + ''.join(teile) + '</div>'


def baue(seite, ist3d):
    teile = [lies('pages', seite, 'head.html'), '<style>', lies('shared', 'style.css')]
    if ist3d:
        teile.append(lies('shared', 'style3d.css'))
    teile.append('</style>')
    body = fassung(lies('pages', seite, 'body.html'), ist3d)
    body = body.replace('</div></header>', navigation(seite, ist3d) + '</div></header>', 1)
    body = body.replace('</main>', blaettern(seite) + '\n</main>', 1)
    teile.append(body)
    if ist3d and seite not in OHNE_3D:
        teile += ['<script>', lies('vendor', 'three.bundle.js'), lies('shared', 'lib3d.js'), '</script>\n']
    js = lies('pages', seite, 'page3d.js' if ist3d else 'page2d.js')
    if os.path.exists(os.path.join(SRC, 'pages', seite, 'common.js')):
        js += lies('pages', seite, 'common.js')
    teile += ['<script>', fassung(lies('shared', 'ui.js'), ist3d), js, '</script>', lies('shared', 'legal.html')]
    return ''.join(teile)


def main():
    for ordner, ist3d in (('lochkamera_3d', True), ('lochkamera', False)):
        os.makedirs(os.path.join(DIST, ordner), exist_ok=True)
        for seite in SEITEN:
            html = baue(seite, ist3d)
            with open(os.path.join(DIST, ordner, seite + '.html'), 'w', encoding='utf8') as f:
                f.write(html)
    index = lies('index.html')
    with open(os.path.join(DIST, 'index.html'), 'w', encoding='utf8') as f:
        f.write(index)
    with open(os.path.join(DIST, '.nojekyll'), 'w') as f:
        f.write('')
    print('fertig:', DIST)


if __name__ == '__main__':
    sys.exit(main())
