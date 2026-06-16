// WebAuthn para biometria (Face ID / Touch ID / Windows Hello)

export function isBiometricSupported() {
  return !!window.PublicKeyCredential;
}

export async function registerBiometric(userId, userName) {
  if (!isBiometricSupported()) throw new Error('Dispositivo nao suporta biometria');

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: '44Taxi', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'required',
      },
      timeout: 60000,
    },
  });

  localStorage.setItem('44taxi_bio_user', userId);
  localStorage.setItem('44taxi_bio_cred', JSON.stringify({
    id: credential.id,
    rawId: Array.from(new Uint8Array(credential.rawId)),
    type: credential.type,
  }));

  return credential;
}

export async function authenticateBiometric() {
  if (!isBiometricSupported()) throw new Error('Dispositivo nao suporta biometria');

  const stored = localStorage.getItem('44taxi_bio_cred');
  if (!stored) throw new Error('Nenhuma biometria cadastrada');

  const cred = JSON.parse(stored);
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{
        id: new Uint8Array(cred.rawId).buffer,
        type: cred.type,
      }],
      userVerification: 'required',
      timeout: 60000,
    },
  });

  return credential;
}

export function hasBiometricRegistered() {
  return !!localStorage.getItem('44taxi_bio_cred');
}

export function removeBiometric() {
  localStorage.removeItem('44taxi_bio_user');
  localStorage.removeItem('44taxi_bio_cred');
}
