import loader from '../assets/anim/Cosmos.json';
import activity from '../assets/images/activity.png';
import aide from '../assets/images/aide.png';
import back from '../assets/images/back.png';
import cadenas from '../assets/images/cadenas.png';
import calendrier from '../assets/images/calendrier.png';
import cloche from '../assets/images/cloche.png';
import close from '../assets/images/close.png';
import cocher from '../assets/images/cocher.png';
import droite from '../assets/images/droite.png';
import email from '../assets/images/email.png';
import femme from '../assets/images/feminin.png';
import genre from '../assets/images/genre.png';
import gmail from '../assets/images/gmail.png';
import gozem from '../assets/images/gozem.png';
import homme from '../assets/images/homme.png';
import identite from '../assets/images/identite.png';
import adresse from '../assets/images/local.png';
import acceuil from '../assets/images/maison.png';
import nvisible from '../assets/images/oeil-coupe.png';
import visible from '../assets/images/oeil-ouvert.png';
import compte from '../assets/images/personne.png';
import sms from '../assets/images/sms.png';
import utilisateur from '../assets/images/utilisateur.png';
import checked from '../assets/images/verifie.png';
import welcome from '../assets/images/welcome.png';
import whats from '../assets/images/whatsapp.png';
import image1 from '../assets/images/1.jpg';
import eco from '../assets/images/eco.png';
import evenement from '../assets/images/evenement.png';
import heure from '../assets/images/heure.png';
import ouidah from '../assets/images/ouidah.png';
import porto from '../assets/images/porto-novo.png';
import prestige from '../assets/images/prestige.png';
import repas from '../assets/images/repas.png';
import shopping from '../assets/images/shopping.png';
import tricycle from '../assets/images/tricycle.png';
import voiture from '../assets/images/voiture.png';
import school from '../assets/images/school.png';
import zem from '../assets/images/zem.png';
import supermarche from '../assets/images/supermarche.png';
import apero from '../assets/images/apero.png';
import panier from '../assets/images/panier.png';
import resto from '../assets/images/resto.png';
import monnaie from '../assets/images/monnaie.png';
import modalback from '../assets/images/modalback.png';
import porgozem from '../assets/images/porgozem.png';
import portefeuille from '../assets/images/portefeuille.png';
import plus from '../assets/images/plus.png';
import pizza from '../assets/images/pizza.jpg';
import riz from '../assets/images/riz.jpg';
import attieke from '../assets/images/attieke.jpg';
import etoile from '../assets/images/etoile.png';


export const footer = [
  {
    'id':1,
    'nom': 'Pizza City',
    'livraison': 650,
    'specialite': 'Fastfood,Pizza',
    'delai': '40-50',
    'image': pizza,
  },
  {
    'id':2,
    'nom': 'Chris Food',
    'note': 2.8,
    'nbr':20,
    'livraison': 500,
    'specialite': 'Africain,Poulet,Salade,chawarma',
    'delai': '40-50',
    'image': riz,
  },
  {
    'id':3,
    'nom': 'Escale de la Rosa',
    'note': 4.3,
    'nbr': 18,
    'livraison': 800,
    'specialite': 'Alloco,Attieke,Chawarma,Poulet',
    'delai': '40-50',
     'image': attieke,
  },
];

export const welcomedata = [
  {
    "id":1,
    "titre": "Déplacez-vous en toute simplicité avec Gozem",
    "description": "Montez à bord et laissez Gozem vous conduire en toute sécurité vers votre destination. Déplacez-vous en toute sécurité en un seul clic.",
    "image": welcome
  },
  {
    "id":2,
    "titre": "Faites-vous livrer vos plats préférés",
    "description": "Commandez chez votre restaurant préféré sans vous déplacer : faites-vous livrer via Gozem Food et savourez chacune de vos envies.",
    "image": welcome
  },
  {
    "id": 3,
    "titre": "Faites-vous livrer vos différents achats",
    "description": "Besoin d'un article ? Commandez-le sur notre marketplace ! Nous vous livrons rapidement vos colis. Gozem Shopping : c'est aussi simple que ça.",
    "image": welcome
  }
];

export const loaders = {
  loader
}
export const onboarding = 
  {
    "id":1,
    "image": image1
  };


export const services = [
  {
    "id":1,
    "title": 'Back to School',
    "nop": 2,
    "operation": [
      {
        'text': 'Back to School-FOOD',
        'icone': school
      },
      {
        'text': 'Back to school-SHOPPING',
        'icone': school
      }
      ,
    ],
    "image": school,
  },
  {
    "id":2,
    "title": 'Zem',
    "nop": 0,
    "operation": [],
    "image": zem,
    "link": 'zem'
  },
  {
    "id":3,
    "title": 'Tricycle',
    "nop": 0,
    "operation": [],
    "image": tricycle,
    "link": 'tricycle'
  },
  {
    "id":4,
    "title": 'Voiture',
    "nop": 0,
    "operation": [],
    "image": voiture,
    "link": 'voiture'
  },
  {
    "id":5,
    "title": 'Prestige',
    "nop": 0,
    "operation": [],
    "image": prestige,
    "link": 'prestige'
  },
  {
    "id":6,
    "title": 'Eco+',
    "nop": 0,
    "operation": [],
    "image": eco,
    "link": 'eco'
  },
  {
    "id":7,
    "title": 'A l\'heure',
    "nop": 0,
    "operation": [],
    "link": 'heure',
    "image": heure
  },
  {
    "id":8,
    "title": 'Porto Novo',
    "nop": 0,
    "operation": [],
    "link": 'porto',
    "image": porto,
  },
  {
    "id":9,
    "title": 'Ouidah',
    "nop": 0,
    "operation": [],
    "image": ouidah,
    "link": 'ouidah'
  },
  {
    "id":10,
    "title": 'Shopping+',
    "nop": 4,
    "operation": [
      {
        'text': 'Supermarches',
        'icone': supermarche,
      },
      {
        'text': 'Apero-Livre a 0F',
        'icone': apero,
      },
      {
        'text': 'Back to shcool-SHOPPING',
        'icone': school,
      },
      {
        'text': 'Boutiques',
        'icone': panier,
      },
    ],
    "image": shopping
  },
  {
    "id":11,
    "title": 'Repas',
    "nop": 2,
    "operation": [
      {
        'text': 'Restaurants',
        'icone': resto,
    },
    {
        'text': 'Bien manger a 1000F',
        'icone': monnaie,
    },
  ],
    "image": repas
  },
  {
    "id":12,
    "title": 'Evenements',
    "nop": 0,
    "operation": [],
    "image": evenement,
    "link": 'evenement'
  }, 
  
];

export const images ={
    welcome,
    back,
    whats,
    close,
    sms,
    gmail,
    email,
    visible,
    nvisible,
    cadenas,
    checked,
    cocher,
    identite,
    genre,
    calendrier,
    droite,
    homme,
    femme,
    utilisateur,
    acceuil,
    aide,
    adresse,
    activity,
    compte,
    cloche,
    gozem,
    modalback,
    porgozem,
    portefeuille,
    plus,
    pizza,
    riz,
    attieke,
    etoile
};