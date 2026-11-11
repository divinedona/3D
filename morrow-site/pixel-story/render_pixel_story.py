"""An independent, original 2D pixel-art walking/rain/umbrella short."""

import argparse
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUTPUT = HERE / "public" / "media"
sys.path.insert(0, str(ROOT / ".scratch" / "video-tools"))
SIZE, SCALE, FPS, SECONDS = 270, 4, 24, 15
INK = (37, 52, 47)
GLYPHS = {
    "A": [14,17,17,31,17,17,17], "B": [30,17,17,30,17,17,30],
    "C": [14,17,16,16,16,17,14], "D": [30,17,17,17,17,17,30],
    "E": [31,16,16,30,16,16,31], "F": [31,16,16,30,16,16,16],
    "G": [14,17,16,23,17,17,15], "H": [17,17,17,31,17,17,17],
    "I": [14,4,4,4,4,4,14], "J": [7,2,2,2,18,18,12],
    "K": [17,18,20,24,20,18,17], "L": [16,16,16,16,16,16,31],
    "M": [17,27,21,21,17,17,17], "N": [17,25,21,19,17,17,17],
    "O": [14,17,17,17,17,17,14], "P": [30,17,17,30,16,16,16],
    "Q": [14,17,17,17,21,18,13], "R": [30,17,17,30,20,18,17],
    "S": [15,16,16,14,1,1,30], "T": [31,4,4,4,4,4,4],
    "U": [17,17,17,17,17,17,14], "V": [17,17,17,17,17,10,4],
    "W": [17,17,17,21,21,21,10], "X": [17,17,10,4,10,17,17],
    "Y": [17,17,10,4,4,4,4], "Z": [31,1,2,4,8,16,31],
    ".": [0,0,0,0,0,12,12], "/": [1,2,2,4,8,8,16],
    "0": [14,17,19,21,25,17,14], "1": [4,12,4,4,4,4,14],
    "2": [14,17,1,2,4,8,31], " ": [0]*7,
}


def ease(value):
    v = max(0.0, min(1.0, value))
    return v*v*(3-2*v)


def pixel_text(draw, text, xy, color=INK, scale=1, center=False):
    text = text.upper()
    width = (len(text)*6-1)*scale
    x, y = xy
    if center:
        x -= width//2
    for char in text:
        for row, bits in enumerate(GLYPHS.get(char, GLYPHS[" "])):
            for col in range(5):
                if bits & (1 << (4-col)):
                    draw.rectangle([x+col*scale, y+row*scale,
                                    x+(col+1)*scale-1, y+(row+1)*scale-1], fill=color)
        x += 6*scale


def background(wet):
    image = Image.new("RGB", (SIZE,SIZE), (173,194,204) if wet else (242,240,221))
    d = ImageDraw.Draw(image)
    # Flat top-down park map: a straight vertical route, no voxel projection.
    grass = (110,149,124) if wet else (159,186,120)
    d.rectangle([0,100,269,269], fill=grass)
    for x in range(5,270,9):
        for y in range(105,270,11):
            if x < 83 or x > 186:
                c = (99,136,116) if wet else (139,168,103)
                d.rectangle([x,y,x+1,y+1], fill=c)
    d.rectangle([82,100,187,269], fill=(89,116,111) if wet else (124,142,112))
    for x in range(88,182,12):
        for y in range(102,274,12):
            base = (164,184,184) if wet else (222,215,184)
            vary = ((x//12+y//12)%3-1)*4
            d.rectangle([x,y,x+10,y+10], fill=tuple(c+vary for c in base))
            d.line([x,y,x+10,y], fill=(191,205,197) if wet else (240,231,205))
    for x in [84,184]:
        d.rectangle([x,100,x+2,269], fill=(189,198,177))
    for x,y in [(33,123),(225,123),(32,205),(228,205)]:
        d.rectangle([x-10,y+20,x+10,y+26], fill=(100,126,98))
        d.rectangle([x-3,y+9,x+3,y+24], fill=(133,95,69))
        # Stepped silhouette and restrained dithering establish pixel-art foliage.
        d.polygon([(x-10,y-12),(x+10,y-12),(x+10,y-8),(x+16,y-8),
                   (x+16,y+6),(x+11,y+6),(x+11,y+12),(x-11,y+12),
                   (x-11,y+6),(x-16,y+6),(x-16,y-8),(x-10,y-8)], fill=(73,115,83))
        d.rectangle([x-10,y-9,x+8,y+6], fill=(105,149,92))
        d.rectangle([x-5,y-9,x+9,y-3], fill=(151,180,103))
        for dx,dy in [(-8,0),(4,4),(0,-5),(9,-1)]:
            d.rectangle([x+dx,y+dy,x+dx+2,y+dy+2], fill=(133,167,97))
    for x,y in [(50,168),(218,165)]:
        d.rectangle([x-12,y-3,x+12,y+7], fill=(106,77,59))
        for yy in [y-2,y+2,y+6]:
            d.rectangle([x-11,yy,x+11,yy+1], fill=(196,151,95))
        for xx in [x-8,x+8]:
            d.rectangle([xx,y+8,xx+1,y+11], fill=(69,84,70))
    for x,y in [(14,158),(67,237),(244,147),(201,235)]:
        d.rectangle([x,y,x+2,y+5], fill=(77,123,74))
        for dx,dy in [(-2,-1),(2,-1),(0,-3),(0,1)]:
            d.rectangle([x+dx,y+dy,x+dx+1,y+dy+1], fill=(239,186,119))
        d.point((x,y-1), fill=(251,229,152))
    return image


def position(t):
    if t < 4.1:
        return 177+t*3.4
    if t < 4.55:
        q=(t-4.1)/0.45
        return 177+3.4*(4.1+0.45*(q-q**3+0.5*q**4))
    stop=191.705
    if t < 9:
        return stop
    if t < 9.5:
        q=(t-9)/0.5
        return stop+3.2*0.5*(q**3-0.5*q**4)
    return stop+3.2*(t-9.25)


def character(image,t):
    foot_y=round(position(t))
    active=(1-ease((t-4.1)/0.45)) if t<9 else ease((t-9)/0.5)
    frame=int(t/0.19)%4 if active>0.4 else 0
    bob=1 if frame in [1,3] else 0
    x,y=119,foot_y-48-bob
    d=ImageDraw.Draw(image)
    d.rectangle([122,foot_y-1,147,foot_y+2],fill=(110,140,130))

    def rect(box,c):
        # Every sprite coordinate is on a two-pixel grid.
        a,b,cx,dy=box
        d.rectangle([x+a*2,y+b*2,x+cx*2-1,y+dy*2-1],fill=c)

    dark=(41,49,48); skin=(241,194,142); orange=(243,111,65)
    # Four poses alternate the lower legs and hand positions.
    left=1 if frame==1 else -1 if frame==3 else 0
    right=-left
    rect([4,17,7,22+left],(91,127,151))
    rect([9,17,12,22+right],(112,146,166))
    rect([4,21+left,7,23+left],dark)
    rect([9,21+right,12,23+right],dark)
    rect([3,10,13,18],orange)
    rect([3,10,5,18],(218,86,51))
    rect([11,11,13,17],(255,141,79))
    rect([7,10,9,12],skin)
    rect([7,12,8,18],(188,76,48))
    rect([4,1,12,10],skin)
    rect([4,1,5,9],(221,158,117))
    rect([3,0,13,3],(75,58,44))
    rect([3,3,5,5],(75,58,44))
    rect([11,3,13,5],(89,67,49))
    rect([5,1,11,2],(106,81,56))
    blink=(2.0<t<2.13) or (10.5<t<10.64)
    rect([5,5,7,6 if blink else 7],dark)
    rect([9,5,11,6 if blink else 7],dark)
    if not blink:
        rect([5,5,6,6],(255,250,223))
        rect([9,5,10,6],(255,250,223))
    rect([4,7,5,8],(223,143,118))
    rect([11,7,12,8],(223,143,118))
    rect([7,8,9,9],(156,91,67))
    rect([1,11-left,3,16-left],orange)
    rect([1,16-left,3,18-left],skin)
    raise_hand=ease((t-6.3)/1.45)
    hand_y=round(16+right-5*raise_hand)
    rect([13,11,15,max(12,hand_y)],(228,94,56))
    rect([13,hand_y,15,hand_y+2],skin)
    if t>=6.2:
        hand=(x+28,y+(hand_y+1)*2)
        umbrella(image,t,hand)
    return foot_y


def umbrella(image,t,hand):
    d=ImageDraw.Draw(image)
    opened=ease((t-7.85)/0.72)
    cx=hand[0]-9*opened
    top=hand[1]-30
    d.rectangle([hand[0]-1,top+2,hand[0]+1,hand[1]+3],fill=(58,77,63))
    d.rectangle([hand[0]-4,hand[1]+2,hand[0],hand[1]+4],fill=(58,77,63))
    if opened<0.03:
        d.rectangle([hand[0]-2,top,hand[0]+3,top+14],fill=(122,165,85))
        d.rectangle([hand[0]-1,top,hand[0]+1,top+12],fill=(175,199,109))
        return
    width=max(3,round(24*opened))
    # Pixel canopy: flat stepped silhouette with color panels, no 3D meshes.
    outline=[(cx-width,top+12),(cx-width,top+8),(cx-width+4,top+8),
             (cx-width+4,top+4),(cx-7,top+4),(cx-7,top),(cx+7,top),
             (cx+7,top+4),(cx+width-4,top+4),(cx+width-4,top+8),
             (cx+width,top+8),(cx+width,top+12)]
    d.polygon(outline,fill=(66,100,66))
    for yy in range(2,11,2):
        half=max(2,round(width*(0.40+yy*0.055)))
        d.rectangle([cx-half,top+yy,cx+half,top+yy+1],fill=(153,185,96))
        d.rectangle([cx-3,top+yy,cx+3,top+yy+1],fill=(195,212,121))
    d.rectangle([cx-1,top-3,cx+1,top],fill=(65,92,61))


def rain(image,t,foot_y):
    intensity=ease((t-4.0)/1.0)
    if intensity<=0:
        return
    d=ImageDraw.Draw(image)
    rng=np.random.default_rng(27)
    opened=ease((t-7.85)/0.72)
    for xx,yy,speed in rng.random((90,3))[:int(90*intensity)]:
        x=int((xx*270-(t-4)*7)%270)
        y=int((yy*200+(t-4)*(95+speed*55))%200)+70
        if opened>0.8 and 119<x<158 and foot_y-81<y<foot_y+2:
            continue
        d.line([(x,y),(x-1,y+3)],fill=(222,237,233))
    for i in range(8):
        phase=int(((t-4)*6+i)%4)
        x=96+(i*17)%77
        y=112+(i*23)%128
        if phase<3:
            d.line([x-phase,y,x+phase,y],fill=(207,225,217))
            if phase==2:
                d.point((x,y-1),fill=(201,220,215))


def frame_at(t,dry,wet):
    image=Image.blend(dry,wet,ease((t-3.8)/1.4))
    foot_y=character(image,t)
    rain(image,t,foot_y)
    d=ImageDraw.Draw(image)
    pixel_text(d,"MORROW / PIXEL STORIES",(15,15),scale=1)
    pixel_text(d,"002",(237,15),scale=1)
    if t<4:
        first,second="JUST A LITTLE WALK.","SEE WHERE IT GOES."
    elif t<9:
        first,second="A LITTLE RAIN.","A LITTLE PREPARATION."
    else:
        first,second="KEEP GOING.","ONE LITTLE STEP AT A TIME."
    pixel_text(d,first,(135,37),scale=2,center=True)
    pixel_text(d,second,(135,63),scale=1,center=True)
    d.rectangle([44,251,226,265],fill=(243,239,212))
    pixel_text(d,"WALK. WONDER. KEEP GOING.",(135,255),scale=1,center=True)
    return image.resize((1080,1080),Image.Resampling.NEAREST)


def make_audio(path):
    rate=44100
    ts=np.arange(rate*SECONDS)/rate
    rng=np.random.default_rng(902)
    noise=rng.normal(0,1,len(ts))
    hiss=noise-np.convolve(noise,np.ones(7)/7,mode="same")
    env=np.clip((ts-4.05)/1.1,0,1)*np.clip((15-ts)/0.35,0,1)
    audio=hiss*env*0.032
    for start in list(np.arange(0.25,4.3,0.38))+list(np.arange(9.35,14.7,0.38)):
        index=int(start*rate); count=int(0.10*rate)
        tt=np.arange(count)/rate
        audio[index:index+count]+=np.sin(2*np.pi*155*tt)*np.exp(-tt*50)*0.07
    index=int(7.85*rate); count=int(0.72*rate)
    tt=np.arange(count)/rate
    audio[index:index+count]+=rng.normal(0,0.025,count)*np.sin(np.pi*tt/0.72)**2
    with wave.open(str(path),"wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate)
        f.writeframes((np.clip(audio,-0.9,0.9)*32767).astype("<i2").tobytes())


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--preview",action="store_true")
    args=parser.parse_args()
    OUTPUT.mkdir(parents=True,exist_ok=True)
    dry,wet=background(False),background(True)
    moments=[1.6,5.5,7.4,8.8,11.7,14.4]
    sheet=Image.new("RGB",(1080,720))
    for i,t in enumerate(moments):
        img=frame_at(t,dry,wet)
        img.save(OUTPUT/f"storyboard-{i+1}.png")
        sheet.paste(img.resize((360,360),Image.Resampling.NEAREST),((i%3)*360,(i//3)*360))
    sheet.save(OUTPUT/"storyboard.png")
    frame_at(2.8,dry,wet).save(OUTPUT/"poster.png")
    print("2D storyboard ready",flush=True)
    if args.preview:
        return
    import imageio_ffmpeg
    exe=imageio_ffmpeg.get_ffmpeg_exe()
    audio=OUTPUT/"rain-and-footsteps.wav"
    make_audio(audio)
    video=OUTPUT/"a-little-rain-2d-pixel.mp4"
    cmd=[exe,"-hide_banner","-loglevel","error","-y","-f","rawvideo","-pixel_format","rgb24",
         "-video_size","1080x1080","-framerate",str(FPS),"-i","pipe:0","-i",str(audio),
         "-c:v","libx264","-preset","fast","-crf","17","-pix_fmt","yuv420p",
         "-c:a","aac","-b:a","128k","-shortest","-movflags","+faststart",str(video)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    try:
        for frame in range(FPS*SECONDS):
            proc.stdin.write(frame_at(frame/FPS,dry,wet).tobytes())
            if frame%48==0:
                print(f"Rendered {frame//FPS}/{SECONDS}s",flush=True)
        proc.stdin.close()
        if proc.wait()!=0:
            raise RuntimeError("MP4 export failed")
    except BaseException:
        proc.kill(); proc.wait(); raise
    probe=subprocess.run([exe,"-hide_banner","-i",str(video)],capture_output=True,text=True).stderr
    assert "1080x1080" in probe and "24 fps" in probe and "Audio: aac" in probe,probe
    duration=re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)",probe)
    assert duration and abs(float(duration[3])-15)<0.1,probe
    check=subprocess.run([exe,"-v","error","-i",str(video),"-f","null","-"],capture_output=True,text=True)
    assert check.returncode==0 and not check.stderr.strip(),check.stderr
    subprocess.run([exe,"-v","error","-y","-ss","11.7","-i",str(video),"-frames:v","1",
                    str(OUTPUT/"verified-frame.png")],check=True)
    (OUTPUT/"verification.json").write_text(json.dumps({"decode":"passed","duration":15,
        "resolution":"1080x1080","fps":24,"style":"2D pixel art","bytes":video.stat().st_size},indent=2))
    print(f"Finished and verified: {video}",flush=True)


if __name__=="__main__":
    main()
