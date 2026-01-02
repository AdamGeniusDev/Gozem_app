import loader from '../assets/anim/Cosmos.json';
import image1 from '../assets/images/1.jpg';
import activity from '../assets/images/activity.png';
import aide from '../assets/images/aide.png';
import anglais from '../assets/images/anglais.png';
import apero from '../assets/images/apero.png';
import attieke from '../assets/images/attieke.jpg';
import back from '../assets/images/back.png';
import billet from '../assets/images/billet.png';
import boutique from '../assets/images/boutique.png';
import cadenas from '../assets/images/cadenas.png';
import calendrier from '../assets/images/calendrier.png';
import cloche from '../assets/images/cloche.png';
import close from '../assets/images/close.png';
import cocher from '../assets/images/cocher.png';
import favori from '../assets/images/coeur.png';
import coeurp from '../assets/images/coeurp.png';
import commande from '../assets/images/commande.png';
import croix from '../assets/images/croix.png';
import deleted from '../assets/images/delete.png';
import del from '../assets/images/deletedroite.png';
import depart from '../assets/images/depart.png';
import dest from '../assets/images/dest.png';
import disabled from '../assets/images/disabled.png';
import droite from '../assets/images/droite.png';
import eco from '../assets/images/eco.png';
import email from '../assets/images/email.png';
import etoile from '../assets/images/etoile.png';
import evenement from '../assets/images/evenement.png';
import expand from '../assets/images/expand.png';
import femme from '../assets/images/feminin.png';
import fil from '../assets/images/fil.png';
import food from '../assets/images/fourchette.png';
import francais from '../assets/images/france.png';
import genre from '../assets/images/genre.png';
import gmail from '../assets/images/gmail.png';
import gozem from '../assets/images/gozem.png';
import heure from '../assets/images/heure.png';
import historique from '../assets/images/historique.png';
import homme from '../assets/images/homme.png';
import identite from '../assets/images/identite.png';
import langue from '../assets/images/langue.png';
import livraison from '../assets/images/livraison.png';
import adresse from '../assets/images/local.png';
import locate from '../assets/images/localisation.png';
import logout from '../assets/images/logout.png';
import acceuil from '../assets/images/maison.png';
import modalback from '../assets/images/modalback.png';
import moins from '../assets/images/moins.png';
import monnaie from '../assets/images/monnaie.png';
import notif from '../assets/images/notif.png';
import nvisible from '../assets/images/oeil-coupe.png';
import visible from '../assets/images/oeil-ouvert.png';
import ouidah from '../assets/images/ouidah.png';
import panier from '../assets/images/panier.png';
import panierr from '../assets/images/panierf.png';
import params from '../assets/images/params.png';
import parrainage from '../assets/images/parrain.png';
import parrain from '../assets/images/parrainage.png';
import compte from '../assets/images/personne.png';
import pizza from '../assets/images/pizza.jpg';
import plus from '../assets/images/plus.png';
import porgozem from '../assets/images/porgozem.png';
import portefeuille from '../assets/images/portefeuille.png';
import porto from '../assets/images/porto-novo.png';
import prestige from '../assets/images/prestige.png';
import reduction from '../assets/images/reduction.png';
import repas from '../assets/images/repas.png';
import resto from '../assets/images/resto.png';
import riz from '../assets/images/riz.jpg';
import school from '../assets/images/school.png';
import search from '../assets/images/search.png';
import settings from '../assets/images/settings.png';
import shopping from '../assets/images/shopping.png';
import sms from '../assets/images/sms.png';
import supermarche from '../assets/images/supermarche.png';
import support from '../assets/images/support.png';
import talk from '../assets/images/talk.png';
import ticket from '../assets/images/ticket.png';
import treduction from '../assets/images/ticketreduction.png';
import total from '../assets/images/total.png';
import tricycle from '../assets/images/tricycle.png';
import utilisateur from '../assets/images/utilisateur.png';
import checked from '../assets/images/verifie.png';
import voiture from '../assets/images/voiture.png';
import welcome from '../assets/images/welcome.png';
import whats from '../assets/images/whatsapp.png';
import zem from '../assets/images/zem.png';
import facture from '../assets/images/facture.png';
import placeholder from '../assets/images/placeholder.jpg';
import plat from '../assets/images/plat.png';
import dorder from '../assets/images/draw_order.png';
import dready from '../assets/images/draw_ready.jpg';
import dcook from '../assets/images/draw_cook.png';
import ddelivering from '../assets/images/draw_delivering.png';
import ddelivered from '../assets/images/delivered.png';
import drejected from '../assets/images/draw_rejected.png';
import dcanceled from '../assets/images/draw_canceled.png';
import rejected from '../assets/images/rejected.png';
import espece from '../assets/images/espece.png';
import iportefeuille from '../assets/images/iportefeuille.png';


import { Data } from '@/types/type';



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


export const services : Data[]= [
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
         'path': '/(restaurants)/food',
    },
    {
        'text': 'Bien manger a 1000F',
        'icone': monnaie,
         'path' : '/(restaurants)/food',
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
    panier,
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
    etoile,
    expand,
    fil,
    depart,
    dest,
    locate,
    heure,
    search,
    params,
    talk,
    support,
    historique,
    reduction,
    ticket,
    parrain,
    settings,
    logout,
    langue,
    deleted,
    del,
    francais,
    anglais,
    notif,
    disabled,
    treduction,
    parrainage,
    food,
    favori,
    panierr,
    commande,
    coeurp,
    moins,
    total,
    livraison,
    billet,
    croix,
    boutique,
    facture,
    placeholder,
    plat,
    dcook,
    dorder,
    dready,
    ddelivering,
    ddelivered,
    drejected,
    dcanceled,
    repas,
    rejected,
    espece,
    iportefeuille
};

export const reasons = [
  {
    main: "Temps d'acceptation trop long"
  },
  {
    main: "J'ai fait une erreur sur la commande"
  },
  {
    main: "Je dois me déplacer"
  },
  {
    main: "J'ai changé d'avis"
  },
  {
    main: "L'agent support Gozem n'est pas courtois"
  },
  {
    main: "Autre"
  }
]