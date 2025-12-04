#include <napi.h>
#include <windows.h>

// Fonction existante pour récupérer la position du curseur
Napi::Object GetCursorPosWrapped(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    POINT p;
    ::GetCursorPos(&p);

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("x", Napi::Number::New(env, p.x));
    obj.Set("y", Napi::Number::New(env, p.y));

    return obj;
}

// Nouvelle fonction pour récupérer la taille de l'écran
Napi::Object GetScreenSizeWrapped(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    int screenWidth = GetSystemMetrics(SM_CXSCREEN);
    int screenHeight = GetSystemMetrics(SM_CYSCREEN);

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("width", Napi::Number::New(env, screenWidth));
    obj.Set("height", Napi::Number::New(env, screenHeight));

    return obj;
}

// Initialisation de l'addon
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getCursorPos", Napi::Function::New(env, GetCursorPosWrapped));
    exports.Set("getScreenSize", Napi::Function::New(env, GetScreenSizeWrapped));
    return exports;
}

NODE_API_MODULE(addon, Init)
