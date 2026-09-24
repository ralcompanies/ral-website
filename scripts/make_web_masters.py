"""Create web-master JPEGs (max 2800px long edge, sRGB, q86) from staged originals.
Originals are never modified. Output goes to src/assets/images/<group>/<slug>/<name>.jpg"""
import os, io, sys
from PIL import Image, ImageOps, ImageCms
Image.MAX_IMAGE_PIXELS = None
U = '/mnt/user-data/uploads/Projects'
W = '/home/claude/src-assets/web'
T = '/home/claude/src-assets/team'
OUT = '/home/claude/ral-site/src/assets/images'
M = {
 # featured
 'projects/zero-irving': [(f'{U}/Zero Irving/20250207_CTC_4159-HDR.jpg','lobby'),(f'{U}/Zero Irving/ZeroIrving_31_cubes.jpg','exterior-dusk'),(f'{U}/Zero Irving/ZeroIrving_22.jpg','exterior-day'),(f'{U}/Zero Irving/20250207_CTC_4102-HDR.jpg','roof-terrace'),(f'{U}/Zero Irving/20250207_CTC_4073-Edit.jpg','clock-tower-view'),(f'{U}/Zero Irving/20250207_CTC_4153-HDR-Edit.jpg','lobby-art-wall'),(f'{U}/Zero Irving/20250207_CTC_4114-HDR-Edit Panorama.jpg','panorama'),(f'{U}/Zero Irving/20250207_CTC_4041-Edit.jpg','civic-hall'),(f'{U}/Zero Irving/20250207_CTC_4180-HDR.jpg','food-hall-terrace'),(f'{U}/Zero Irving/20250207_CTC_3911-HDR-Edit.jpg','tenant-floor'),(f'{U}/Zero Irving/ZeroIrving_09.jpg','lobby-reception')],
 'projects/quay-tower': [(f'{U}/QUAY Tower/Park Context_2.jpg','aerial-park-context'),(f'{U}/QUAY Tower/190919_EJ_quay_tower-0477_HIGH RES.jpg','exterior'),(f'{U}/QUAY Tower/190919_EJ_QUAY_TOWER-0032_HIGH RES.jpg','exterior-aerial'),(f'{U}/QUAY Tower/190919_EJ_QUAY_TOWER-0593_HIGH RES.jpg','terrace-dusk'),(f'{U}/QUAY Tower/190614_EJ_190614_QUAY_TOWER_3-0160_HIGH RES.jpg','living-harbor'),(f'{U}/QUAY Tower/190614_EJ_190614_QUAY_TOWER_3-0173_HIGH RES.jpg','dining'),(f'{U}/QUAY Tower/190919_EJ_quay_tower-0153_HIGH RES.jpg','lobby'),(f'{U}/QUAY Tower/190919_EJ_QUAY_TOWER-0583_HIGH RES.jpg','penthouse-living'),(f'{U}/QUAY Tower/190614_EJ_190614_QUAY_TOWER_3-0018_HIGH RES.jpg','kitchen'),(f'{U}/QUAY Tower/190919_EJ_quay_tower-0373_HIGH RES.jpg','bath')],
 'projects/mandarin-oriental-grand-cayman': [(f'{U}/MOGC/109 1B Residences – Exterior – scene from pool-1110.jpg','aerial'),(f'{U}/MOGC/1B Hero over Ironshore.jpg','ironshore'),(f'{U}/MOGC/Facade at Twilight.jpg','facade-twilight'),(f'{U}/MOGC/Amenity Pool Deck 01.jpg','pool-deck'),(f'{U}/MOGC/1B Arrival.jpg','arrival'),(f'{U}/MOGC/GardenHouse_PrivatePool_HighRes.jpg','garden-house-pool'),(f'{U}/MOGC/Penthouse_GreatRoom_HighRes.jpg','penthouse-great-room'),(f'{U}/MOGC/Penthouse_RoofDeck_HighRes.jpg','penthouse-roof'),(f'{U}/MOGC/OceanHouse Lobby_HighRes.jpg','ocean-house-lobby'),(f'{U}/MOGC/Penthouse_Dining_HighRes.jpg','penthouse-dining')],
 'projects/roan-steamboat': [(f'{U}/ROAN Web Assets/BINYAN_RAL3492_RoanSteamboat_S010_Final3500.jpg','winter-mountain'),(f'{U}/ROAN Web Assets/ROAN_EXTERIOR 1_UPDATED.jpg','exterior-summer'),(f'{U}/ROAN Web Assets/ROAN_EXTERIOR 1_WINTER HERO SHOT.JPG','exterior-winter'),(f'{U}/ROAN Web Assets/ROAN_EXTERIOR 4.jpg','exterior-gable'),(f'{U}/ROAN Web Assets/BINYAN_RAL3492_RoanSteamboat_S020_Final3500.jpg','living-stair'),(f'{U}/ROAN Web Assets/ROAN_INTERIOR KITCHEN 2.jpg','kitchen'),(f'{U}/ROAN Web Assets/ROAN_INTERIOR TERRACE 1.jpg','terrace'),(f'{U}/ROAN Web Assets/ROAN_INTERIOR LIVING ROOM.jpg','living'),(f'{U}/ROAN Web Assets/ROAN_INTERIOR BATHROOM 1_V1.jpg','bath'),(f'{U}/ROAN Web Assets/Lifestlye/A7R09918-Edit-Edit.jpg','steamboat-night')],
 'projects/the-landing': [(f'{U}/The Landing/190919_EJ_quay_tower-0453_HIGH RES.jpg','exterior'),(f'{U}/The Landing/LANDING_-113.jpg','lobby'),(f'{U}/The Landing/LANDING_-151.jpg','roof-terrace'),(f'{U}/The Landing/LANDING_-130.jpg','lounge'),(f'{U}/The Landing/LANDING_-120.jpg','kitchen-lounge'),(f'{U}/The Landing/LANDING_-109.jpg','reception'),(f'{U}/The Landing/LANDING_-148.jpg','terrace-dining'),(f'{U}/The Landing/Print_07.jpg','residence')],
 'projects/four-seasons-houston': [(f'{W}/fsh_4s_head.jpg','bar'),(f'{W}/fsh_4s1.jpg','lobby'),(f'{W}/fsh_4s9.jpg','pool'),(f'{W}/fsh_4s5.jpg','bar-detail'),(f'{W}/fsh_houstonabstract.jpg','ballroom')],
 'projects/casa-fiu': [(f'{W}/casa_Hero-2.jpg','aerial'),(f'{W}/casa_Hero-1.jpg','tower'),(f'{W}/casa_Dusk.jpg','dusk'),(f'{W}/casa_Hero-with-pool.jpg','amenity-deck'),(f'{W}/casa_pool-image.jpg','pool')],
 # portfolio
 'projects/one-brooklyn-bridge-park': [(f'{U}/_Other Projects/One Brooklyn Bridge Park - Brooklyn Heights/Obbp Hero.jpg','card')],
 'projects/monogram-new-york': [(f'{W}/fsh_monogram-exterior-sidewalk-scaled.jpg','card')],
 'projects/four-seasons-vail': [(f'{U}/_Other Projects/Four Seasons Vail - Colorado/1_WI03960.jpg','card')],
 'projects/270-broadway': [(f'{U}/_Other Projects/270 Broadway - Tribeca/270-chambersbroadway.jpg','card')],
 'projects/carillon-miami-beach': [(f'{U}/_Other Projects/Canyon Ranch Living Miami Beach - Florida/#5339.jpg','card')],
 'projects/hotel-madeline-telluride': [(f'{U}/_Other Projects/Telluride Mountain Village Resort - Colorado/2_Exterior_1.jpg','card')],
 'projects/kartrite-resort': [(f'{W}/fsh_lazyriver1-713x475_2x.jpg','card')],
 'projects/loft-25': [(f'{U}/_Other Projects/Loft 25 - Chelsea/1_MG_8284-b_retouched.jpg','card')],
 'projects/james-hotel-new-york': [(f'{U}/_Other Projects/James Hotel New York - Soho/james hotel interior.jpg','card')],
 'projects/four-seasons-atlanta': [(f'{U}/_Other Projects/FS Atlanta/ATL_773.jpg','card')],
 'projects/15-union-square-west': [(f'{U}/_Other Projects/15 Union Square West - Union Square/15_Union_Square_West-crop.jpg','card')],
 'projects/inn-at-lost-creek': [(f'{U}/_Other Projects/The Inn at Lost Creek - Telluride/2_Wint Ext Dusk TP photo.300e.jpg','card')],
 'projects/spring-creek': [(f'{U}/_Other Projects/Spring Creek - Colorado/1_P1010021.JPG','card')],
 'projects/franklin-tower': [(f'{W}/fsh_franklin-tower-new-york-ny-primary-photo.jpg','card')],
 'projects/brookchester-court': [(f'{U}/_Other Projects/Brookchester Court - Port Chester/1_BrookchesterEntry051307 001 (2).jpg','card')],
 'projects/prosperite-barge': [(f'{U}/_Other Projects/Prosperite Barge - France/prosp_cruising4.jpg','card')],
 'projects/parkwood-sports-complex': [(f'{U}/_Other Projects/Parkwood/03_Exterior ViewA.JPG','card')],
 'projects/86-chambers': [(f'{U}/_Other Projects/86 Chambers - Tribeca/003056_3.jpg','card')],
 'projects/the-new-yorker': [(f'{U}/_Other Projects/The New Yorker - Upper East Side/1_IMG_1275-b(FR)_new.jpg','card')],
 'projects/williamsburg-terrace': [(f'{U}/_Other Projects/Williamsburg Terrace - Brooklyn/1 (1).jpg','card')],
 'projects/orchard-street-hotel': [(f'{U}/_Other Projects/Orchard Street Hotel - Lower East Side/14a017059974afca5b8a99f81f28f01b.jpg','card')],
 'site': [(f'{W}/fsh_bridgepark_helishoot-2577.jpg','brooklyn-bridge-park-aerial')],
}
TEAM = {'robert-a-levine':'ral_cropped_selects_robert.jpg','vincent-cangelosi':'ral_cropped_selects_vincent.jpg','spencer-levine':'spencer0090-crop.jpg','josh-wein':'ral_cropped_selects_josh.jpg','stuart-taft':'ral_cropped_selects_stewart.jpg','jerry-gallo':'ral_cropped_selects_jerry.jpg','david-sorenson':'d_sorenson.jpg','tom-casciano':'ral_cropped_selects_tom.jpg','douglas-eisenstein':'doug_eisenstein-new.jpg','valerie-kirsten':'kgp2019_ral_headshots-29.jpg','david-wu':'ral_cropped_selects_david.jpg','leah-rosen':'l_volpe.jpg','matt-delia':'ral_cropped_selects_matt.jpg'}
srgb = ImageCms.createProfile('sRGB')
def save(src, dst, maxe=2800, q=86):
    im = Image.open(src)
    icc = im.info.get('icc_profile')
    im = ImageOps.exif_transpose(im)
    if im.mode not in ('RGB',):
        if im.mode == 'CMYK' and icc is None:
            im = im.convert('RGB')
    if icc:
        try:
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), srgb, outputMode='RGB')
        except Exception as e:
            im = im.convert('RGB')
    im = im.convert('RGB')
    w, h = im.size
    s = min(1, maxe / max(w, h))  # never upscale
    if s < 1: im = im.resize((round(w*s), round(h*s)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)
    return (w, h), im.size
rows = []
for g, items in M.items():
    for src, name in items:
        o, n = save(src, f'{OUT}/{g}/{name}.jpg')
        rows.append((g, name, os.path.basename(src), f'{o[0]}x{o[1]}', f'{n[0]}x{n[1]}'))
for slug, f in TEAM.items():
    o, n = save(f'{T}/{f}', f'{OUT}/people/{slug}.jpg', maxe=1600)
    rows.append(('people', slug, f, f'{o[0]}x{o[1]}', f'{n[0]}x{n[1]}'))
import csv
with open('/home/claude/ral-site/scripts/web_masters.csv','w',newline='') as fh:
    csv.writer(fh).writerows([('group','name','source','source_px','web_px')]+rows)
print(len(rows))
