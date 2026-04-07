## safe-notes-for-pc
一款参考 [Safe Notes](https://github.com/keshav-space/safenotes) 项目实现的、纯本地的、极简的、在 PC 端使用的加密笔记应用。适用于安全记录个人敏感信息。

## 功能特点
- AES 强加密
- 完全本地化
- 禁止联网
- 功能简洁
- 文本/MD 双视图
- 快捷复制功能（双击复制）

## 适用的系统
该应用适用于所有可运行 WebView 的现代化操作系统。


## 安装
```bash
# 克隆项目
git clone https://github.com/yongyiyong/safe-notes-for-pc.git
cd project

# 安装依赖
pip install -r requirements.txt
```

## 运行
```bash
# 常规方式运行
python src/main.py

# 以 DEBUG 方式运行
python src/main.py --debug
```

## 打包
```bash
pyinstaller safe-notes-for-pc.spec
```


## 依赖的项目
- Bootstrap5
- MarkedJS
- DOMPurify
- CryptoJS

