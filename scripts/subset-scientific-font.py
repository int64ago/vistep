"""Subset an OFL Noto Sans Regular TTF for scientific labels in raster cards.
Usage: python scripts/subset-scientific-font.py /path/to/NotoSans-Regular.ttf
The original font remains under the SIL OFL in scripts/assets/NotoScientific-LICENSE.txt.
"""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
source = Path(sys.argv[1])
font = TTFont(source)
options = subset.Options()
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
options.name_legacy = True
options.name_languages = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=[*range(0x2000, 0x2300), *range(0x370, 0x400), 0xB0, 0xB1, 0xB2, 0xB3, 0xB7])
subsetter.subset(font)
font.save(Path(__file__).parent / 'assets' / 'NotoScientific.ttf')
