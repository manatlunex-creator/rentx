import logging
from aiogram import Bot, Dispatcher, executor, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# Sənin verdiyin bot tokeni
API_TOKEN = "8835423045:AAFuo2jySSvH5glpwqldpSN_ygmU-fGVnt8"

# Sənin verdiyin GitHub Pages linki
WEB_APP_URL = "https://manatlunex-creator.github.io/rentx/"

logging.basicConfig(level=logging.INFO)

bot = Bot(token=API_TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(commands=['start'])
async def send_welcome(message: types.Message):
    welcome_text = (
        "🔥 **RentX-ə Xoş Gəlmisiniz!**\n\n"
        "PUBG Mobile hesablarının etibarlı kirayə və alqı-satqı platforması.\n"
        "Aşağıdakı düyməyə basaraq tətbiqə daxil ola bilərsiniz:"
    )
    
    # Web App düyməsi
    keyboard = InlineKeyboardMarkup()
    keyboard.add(InlineKeyboardButton(
        text="🚀 RentX-ə Daxil Ol", 
        web_app=WebAppInfo(url=WEB_APP_URL)
    ))
    
    await message.answer(welcome_text, parse_mode="Markdown", reply_markup=keyboard)

if __name__ == '__main__':
    executor.start_polling(dp, skip_updates=True)
  
