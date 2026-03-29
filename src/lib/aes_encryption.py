
"""
AES 加解密算法，借助 AI 转换 Dart 代码而来
源码导航：https://github.com/keshav-space/safenotes/blob/main/lib/encryption/aes_encryption.dart
"""

import os
import hashlib
import base64
import pyaes
from typing import Tuple


def generate_random_string(length: int) -> str:
    """生成指定长度的随机字符串（ASCII 33-122范围）"""
    return ''.join(chr(os.urandom(1)[0] % 33 + 89) for _ in range(length))


def generate_random_non_zero_bytes(length: int) -> bytes:
    """生成指定长度的非零随机字节数组"""
    return bytes([(os.urandom(1)[0] % 245) + 1 for _ in range(length)])


def derive_key_and_iv(passphrase: str, salt: bytes) -> Tuple[bytes, bytes]:
    """
    从口令和盐派生密钥和初始化向量(IV)
    使用SHA256迭代直到获得足够的字节
    """
    password_bytes = passphrase.encode('utf-8')
    concatenated_hashes = b''
    current_hash = b''

    # 需要48字节（32字节密钥 + 16字节IV）
    while len(concatenated_hashes) < 48:
        pre_hash = current_hash + password_bytes + salt if current_hash else password_bytes + salt
        current_hash = hashlib.sha256(pre_hash).digest()
        concatenated_hashes += current_hash

    return concatenated_hashes[:32], concatenated_hashes[32:48]  # AES-256密钥 + IV


def pkcs7_pad(data: bytes, block_size: int = 16) -> bytes:
    """
    使用PKCS7填充数据到指定块大小的整数倍
    PKCS7 填充规范要求：即使正好是整数倍，也要再补一个完整块，防止解密时丢失数据
    """
    padding_length = block_size - (len(data) % block_size)
    return data + bytes([padding_length] * padding_length)


def pkcs7_unpad(data: bytes) -> bytes:
    """移除PKCS7填充"""
    padding_length = data[-1]
    return data[:-padding_length]


def encrypt_aes(plaintext: str, passphrase: str) -> str:
    """
    使用AES-CBC加密文本
    返回格式：Base64(随机字符串(8) + salt(8) + 密文)
    """
    salt = generate_random_non_zero_bytes(8)
    encryption_key, iv = derive_key_and_iv(passphrase, salt)
    random_prefix = generate_random_string(8).encode('utf-8')

    plaintext_bytes = pkcs7_pad(plaintext.encode('utf-8'))
    block_size = 16
    cipher_blocks = []

    aes_cipher = pyaes.AESModeOfOperationCBC(encryption_key, iv=iv)
    # pyaes 加解密每次能且只能处理 16 字节，所以要分块处理
    for i in range(0, len(plaintext_bytes), block_size):
        block = plaintext_bytes[i:i + block_size]
        cipher_blocks.append(aes_cipher.encrypt(block))

    # 组合所有部分并Base64编码
    encrypted_data = random_prefix + salt + b''.join(cipher_blocks)
    return base64.b64encode(encrypted_data).decode('utf-8')


def decrypt_aes(encrypted_data: str, passphrase: str) -> str:
    """解密AES-CBC加密的数据"""
    encrypted_bytes = base64.b64decode(encrypted_data)
    salt = encrypted_bytes[8:16]  # 提取salt（跳过前8字节随机前缀）
    ciphertext = encrypted_bytes[16:]  # 剩余部分是密文

    # pyaes 加解密每次能且只能处理 16 字节，所以要分块处理
    block_size = 16
    ciphertext_blocks = [ciphertext[i:i + block_size] for i in range(0, len(ciphertext), block_size)]

    decryption_key, iv = derive_key_and_iv(passphrase, salt)
    aes_cipher = pyaes.AESModeOfOperationCBC(decryption_key, iv=iv)

    decrypted_blocks = []
    for block in ciphertext_blocks:
        decrypted_blocks.append(aes_cipher.decrypt(block))

    # 合并解密结果并移除填充
    decrypted_data = pkcs7_unpad(b''.join(decrypted_blocks))
    return decrypted_data.decode('utf-8')
