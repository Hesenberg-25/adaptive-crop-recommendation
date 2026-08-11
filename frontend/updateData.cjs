const fs = require('fs');

const urls = `Rice: https://as2.ftcdn.net/v2/jpg/08/71/25/51/1000_F_871255119_9sfCYTloalVGac7ZAM5F1ADUv5ZXCjuM.jpg
Wheat: https://chatgpt.com/backend-api/estuary/content?id=file_000000008244820798fc4056ebe8f731&ts=496217&p=fs&cid=1&sig=edaa83a39b9643cd141ba5c4f78eac91af31bce355b57ae47de62295c16cebc4&v=0
Maize: https://as2.ftcdn.net/v2/jpg/09/49/13/93/1000_F_949139356_3ZFuYjKHBYEaQmhrmxh3S3TQsU3LNtlc.jpg
Sorghum: https://as2.ftcdn.net/v2/jpg/20/13/79/39/1000_F_2013793913_OdfI9MkNzyMYcO507mONC8IPyzJhc5Gp.jpg
Pearl Millet: https://as2.ftcdn.net/v2/jpg/04/37/05/13/1000_F_437051356_KVZnnezrFAk6Xo20PvA7ctw3FZ0DQk2b.jpg
Chickpea: https://pureandwhole.co.za/wp-content/uploads/2021/11/chickpeas.jpg
Kidneybeans: https://chatgpt.com/backend-api/estuary/content?id=file_000000001c6c82069cac455885155cd8&ts=496218&p=fs&cid=1&sig=e814f46f87024e79810a693da3cfcd04fd8d138c57bfd2ec0eb458af96d5a623&v=0
Pigeonpeas: https://chatgpt.com/backend-api/estuary/content?id=file_00000000eba0820899acdb6a58d24905&ts=496240&p=fs&cid=1&sig=53d6ffa005196ae2ca132a48f5d287a2e31ada709f8049e3310521ff02d0c6ce&v=0
Mothbeans: https://5.imimg.com/data5/RF/ZL/FO/SELLER-4987194/moth-beans.png
Mungbean: https://media.post.rvohealth.io/wp-content/uploads/sites/3/2020/02/324156_2200-800x1200.jpg
Blackgram: https://cdn.pixelbin.io/v2/plain-cake-860195/netmed/wrkr/nmz/platform/extensions/cms-blog/free/original/aUx9uI-j0-blogImge
Lentil: https://vibrantliving.in/cdn/shop/files/RedMasoorDalSplitSkinless.jpg?v=1731059680&width=2048
Peas: https://as1.ftcdn.net/v2/jpg/00/33/77/00/1000_F_33770088_HXwzySc5vZbp6ChZo378eXfpjA0Hz6I7.jpg
Soybean: https://gonefarmers.com/cdn/shop/products/image_38a270c5-4d4b-4b34-960c-8f8e23cca776_2048x.heic?v=1658505369
Cabbage: https://images.unsplash.com/photo-1697346327617-c333613a349a?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Cauliflower: https://images.unsplash.com/photo-1692956706779-576c151ec712?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Carrot: https://as2.ftcdn.net/v2/jpg/04/34/90/49/1000_F_434904940_QAjS6rRkv9WtoKeGnXd3U6b0D8RUdq0t.jpg
Radish: https://cdn.britannica.com/19/234319-050-B273922D/Daikon-radish.jpg
Onion: https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Garlic: https://images.unsplash.com/photo-1741518077910-d5449aaa1636?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Spinach: https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Tomato: https://plus.unsplash.com/premium_photo-1661833100239-de8f260b6f8c?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Potato: https://as2.ftcdn.net/v2/jpg/05/03/85/17/1000_F_503851762_GhOTaDzziA1mlmsAAGC1ggYgGqmBHKtJ.jpg
Fenugreek: https://as1.ftcdn.net/v2/jpg/03/08/37/90/1000_F_308379064_imKYU2eyxRdCY0kY52P77UjYvfY0okhN.jpg
Pomegranate: https://as1.ftcdn.net/v2/jpg/00/23/56/44/1000_F_23564400_ZTu4HD4sDDJEaC2IxS58GDhR9t3Zcsu2.jpg
Banana: https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Mango: https://chatgpt.com/backend-api/estuary/content?id=file_00000000dc788206899952128f8d5bf2&ts=496217&p=fs&cid=1&sig=feede2076ca63f56989d3984e94c9dc1a858bdb7aaf4fedd5bdb25a8f9116190&v=0
Grapes: https://images.unsplash.com/photo-1539519532614-723937382b86?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Watermelon: https://images.unsplash.com/photo-1672155984538-351971a96b09?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Muskmelon: https://as1.ftcdn.net/v2/jpg/03/13/26/44/1000_F_313264476_NjXJB4sLM3aLddCEvjhdHtztB7KT2INF.jpg
Apple: https://plus.unsplash.com/premium_photo-1661322640130-f6a1e2c36653?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Orange: https://as2.ftcdn.net/v2/jpg/03/10/19/81/1000_F_310198165_I9CLr3Lv6rfgtT2hN571pEJkF2voKDvT.jpg
Papaya: https://cdn.mos.cms.futurecdn.net/v2/t:0,l:200,cw:1200,ch:1200,q:80,w:1200/g7YTkCzPqJcCKSfEQi6hfE.jpg
Coconut: https://chatgpt.com/backend-api/estuary/content?id=file_00000000ab5482069d794d4c401cdebd&ts=496218&p=fs&cid=1&sig=c7c196633928922c09415bfae195fa8e861542837170138e75b80550cb4550f7&v=0
Cotton: https://static.vecteezy.com/system/resources/thumbnails/015/990/308/small/ripe-cotton-plant-in-a-field-in-turkey-photo.jpg
Jute: https://as1.ftcdn.net/v2/jpg/19/22/66/20/1000_F_1922662026_0uBXPTegcwQRE0xICPwgThxvQpfjMHml.jpg
Coffee: https://s3-alpha.figma.com/hub/file/2324984438288694833/aae344ba-2f31-478d-9443-151745a24ca5-cover.png
Tea: https://images.unsplash.com/photo-1602943543714-cf535b048440?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8dGVhJTIwbGVhdmVzfGVufDB8fDB8fHww
Sugarcane: https://as2.ftcdn.net/v2/jpg/01/05/07/85/1000_F_105078562_bRywiaGCN2h8tQRygAkUS3Dou1Ngjf3B.jpg
Groundnut: https://images.unsplash.com/photo-1785619564649-658675821809?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
Mustard: https://lh4.googleusercontent.com/W7fIFW4HvoHVUa6kP7-5DSpS3BFV6ZBEJN5AXl1QyYM4QlLDfhVIJV_4A3L8sR7dsdaUWTE41pFecQCpSgVMF1Qq2IYkgbET6uWHRcWs5_O-Ote5po4AoRU4jh_RnV3lcx8LTYsVLqq1N9zEifguAYhFTg-9q2uFK8-Cjqa4EABw3sEMkmYdCLQH3g
Sunflower: https://www.allthatgrows.in/cdn/shop/files/SunflowerRussianGiantSeeds.jpg?v=1754130908&width=1080
Safflower: https://upload.wikimedia.org/wikipedia/commons/7/7f/Safflower.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original
Sesame: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDXeknpHCJebDQKvU8AKmG3zgJ9DJzBlglVJcTxP0lGDfSjq9_6Guib8Q&s=10
Linseed: https://5.imimg.com/data5/SELLER/Default/2022/9/SI/ZQ/OT/139751067/flax-seeds-linseeds.jpg
Castor: https://5.imimg.com/data5/II/JC/EM/SELLER-75729806/castor-seeds.jpg
Turmeric: https://chatgpt.com/backend-api/estuary/content?id=file_00000000e700820698d9172cb6e0156c&ts=496218&p=fs&cid=1&sig=77d192467d607182f6bc8c7d4eb971cf010cbe44806aea52223d6390b29a4afc&v=0`;

const mappings = {};
urls.split('\n').forEach(line => {
  const [name, ...rest] = line.split(':');
  if (name && rest.length > 0) {
    let key = name.trim().replace('-', ' ');
    if(key === 'Pearl Millet') key = 'Pearl Millet';
    else if(key === 'Kidneybeans' || key === 'KidneyBeans') key = 'Kidneybeans';
    else if(key === 'Pigeonpeas' || key === 'PigeonPeas') key = 'Pigeonpeas';
    else if(key === 'Mothbeans' || key === 'Moth Beans') key = 'Mothbeans';
    else if(key === 'Mungbean' || key === 'MungBean') key = 'Mungbean';
    else if(key === 'Blackgram' || key === 'BlackGram') key = 'Blackgram';
    mappings[key] = rest.join(':').trim();
  }
});

let content = fs.readFileSync('src/data/cropDetailData.js', 'utf8');

for (const [key, url] of Object.entries(mappings)) {
    const searchStr = `'${key}': {`;
    const searchStr2 = `"${key}": {`;
    
    let idx = content.indexOf(searchStr);
    if (idx === -1) idx = content.indexOf(searchStr2);
    
    if (idx !== -1) {
        const nextUnsplash = content.indexOf('unsplashQuery:', idx);
        if (nextUnsplash !== -1) {
            const endOfLine = content.indexOf('\n', nextUnsplash);
            content = content.slice(0, endOfLine) + `,\n    imageUrl: '${url}'` + content.slice(endOfLine);
        }
    }
}

fs.writeFileSync('src/data/cropDetailData.js', content);
console.log('Updated cropDetailData.js');
