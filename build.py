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


def lies(*teile):
    with open(os.path.join(SRC, *teile), encoding='utf8') as f:
        return f.read()


def fassung(text, ist3d):
    """Bedingte Blöcke auflösen."""
    muster = re.compile(r'<!--@3d-->\n?(.*?)<!--@2d-->\n?(.*?)<!--@end-->\n?', re.S)
    return muster.sub(lambda m: m.group(1) if ist3d else m.group(2), text)


def baue(seite, ist3d):
    teile = [lies('pages', seite, 'head.html'), '<style>', lies('shared', 'style.css')]
    if ist3d:
        teile.append(lies('shared', 'style3d.css'))
    teile.append('</style>')
    teile.append(fassung(lies('pages', seite, 'body.html'), ist3d))
    if ist3d and seite not in OHNE_3D:
        teile += ['<script>', lies('vendor', 'three.bundle.js'), lies('shared', 'lib3d.js'), '</script>\n']
    js = lies('pages', seite, 'page3d.js' if ist3d else 'page2d.js')
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
