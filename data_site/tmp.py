import urllib.request

with open("distance_files/style.css") as f:
  line = f.readline()
  while line:
    line = f.readline()
    if "background-image:" in line:
      img = line.split("url(")[1].split(")")[0]
      print(img[4:-1])
      img = img[4:-1].split('?')[0]
      urllib.request.urlretrieve("http://travian.kirilloid.ru/"+img, img)