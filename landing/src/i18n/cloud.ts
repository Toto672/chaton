import type { LanguageCode } from "./translations";

type CloudCopy = {
  nav: {
    home: string;
    pricing: string;
    signUp: string;
    logIn: string;
  };
  shared: {
    authPanelEyebrow: string;
    authPanelTitle: string;
    authPanelBody: string;
    authPanelItems: [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    monthlyLabel: string;
    annualLabel: string;
    annualNote: string;
    primaryCta: string;
    secondaryCta: string;
    compareLabel: string;
    priceSuffix: string;
    includedLabel: string;
    includedItemsIntro: string;
    comparisonSubtitle: string;
    ctaTitle: string;
    ctaBody: string;
    ctaPrimary: string;
    ctaSecondary: string;
    plans: [
      {
        name: string;
        audience: string;
        monthlyPrice: string;
        annualPrice: string;
        blurb: string;
        highlight?: string;
        cta: string;
        bullets: [string, string, string, string];
      },
      {
        name: string;
        audience: string;
        monthlyPrice: string;
        annualPrice: string;
        blurb: string;
        highlight?: string;
        cta: string;
        bullets: [string, string, string, string];
      },
      {
        name: string;
        audience: string;
        monthlyPrice: string;
        annualPrice: string;
        blurb: string;
        highlight?: string;
        cta: string;
        bullets: [string, string, string, string];
      },
    ];
    includedTitle: string;
    includedItems: [string, string, string, string];
    comparisonTitle: string;
    comparisonRows: Array<{
      label: string;
      values: [string, string, string];
    }>;
  };
  portal: {
    title: string;
    subtitle: string;
    primaryCta: string;
    primaryCtaConnected: string;
    secondaryCta: string;
    quickLinks: [string, string, string];
    panelTitle: string;
    panelBody: string;
    steps: [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
    featuresHeader: string;
    featuresTitle: string;
    featuresBody: string;
    features: [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
  };
  signup: {
    eyebrow: string;
    title: string;
    subtitle: string;
    fullName: string;
    email: string;
    password: string;
    fullNamePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    pending: string;
  };
  login: {
    eyebrow: string;
    title: string;
    subtitle: string;
    email: string;
    password: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    pending: string;
    forgotPassword: string;
  };
  onboarding: {
    setupTitle: string;
    setupSubtitle: string;
    summaryEyebrow: string;
    summaryTitle: string;
    summaryBody: string;
    summaryItems: [string, string, string];
    statusReady: string;
    statusPending: string;
    organizationStatus: string;
    providersStatus: string;
    desktopStatus: string;
    steps: {
      organization: {
        eyebrow: string;
        title: string;
        subtitle: string;
        activeOrganization: string;
        nameLabel: string;
        namePlaceholder: string;
        urlLabel: string;
        urlPlaceholder: string;
        urlPreview: string;
        planLabel: string;
        save: string;
        saving: string;
      };
      provider: {
        eyebrow: string;
        title: string;
        subtitle: string;
        providerLabel: string;
        secretLabel: string;
        secretPlaceholder: string;
        add: string;
        adding: string;
        noProvider: string;
        secretPrefix: string;
        connectedProviders: string;
      };
      desktop: {
        eyebrow: string;
        title: string;
        subtitle: string;
        infoTitle: string;
        step1: string;
        step2: string;
        step3: string;
        openDesktop: string;
        backToPortal: string;
        prereqOrganization: string;
        prereqProvider: string;
      };
    };
    completion: {
      title: string;
      body: string;
      cta: string;
    };
    plans: [
      { label: string; detail: string },
      { label: string; detail: string },
      { label: string; detail: string },
    ];
  };
  forgotPassword: {
    eyebrow: string;
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    submit: string;
    pending: string;
    success: string;
    backToLogin: string;
  };
  resetPassword: {
    eyebrow: string;
    title: string;
    subtitle: string;
    newPassword: string;
    confirmPassword: string;
    newPasswordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    missingToken: string;
    mismatch: string;
    submit: string;
    pending: string;
    success: string;
    backToLogin: string;
  };
  verifyEmail: {
    eyebrow: string;
    title: string;
    subtitle: string;
    pending: string;
    success: string;
    missingToken: string;
    continueToLogin: string;
  };
};

const en: CloudCopy = {
  nav: { home: "Home", pricing: "Pricing", signUp: "Sign up", logIn: "Log in" },
  shared: {
    authPanelEyebrow: "Chatons Cloud",
    authPanelTitle: "A cloud workspace built for real team continuity.",
    authPanelBody:
      "Keep projects, conversations, and organization-managed access in one place while the desktop stays fast and focused.",
    authPanelItems: [
      {
        title: "Shared workspaces",
        body: "Teams collaborate in the same projects, threads, and environment.",
      },
      {
        title: "Persistent conversations",
        body: "Cloud conversations stay available across devices and working sessions.",
      },
      {
        title: "Organization-managed access",
        body: "Provider access lives with the organization instead of each individual machine.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Simple cloud pricing for durable AI work.",
    subtitle:
      "From a focused solo setup to a high-capacity shared workspace, choose the plan that fits how your team runs work in parallel.",
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    annualNote: "Save about 17% with annual billing",
    primaryCta: "Start with Chatons Cloud",
    secondaryCta: "See cloud setup",
    compareLabel: "Compare plans",
    priceSuffix: "/month",
    includedLabel: "Included with every plan",
    includedItemsIntro: "Shared workspace, shared projects, organization-managed access, and cloud conversations that stay available when your team signs off.",
    comparisonSubtitle: "A quick view of what changes as your team needs more capacity.",
    ctaTitle: "Ready to set up your cloud workspace?",
    ctaBody: "Create your organization, connect providers, and start running shared conversations in minutes.",
    ctaPrimary: "Get started",
    ctaSecondary: "View cloud overview",
    plans: [
      {
        name: "Plus",
        audience: "For solo builders and tiny teams",
        monthlyPrice: "$19",
        annualPrice: "$16",
        blurb: "A focused starting point for individuals and small teams moving one cloud workflow at a time.",
        cta: "Start on Plus",
        bullets: [
          "1 parallel cloud runtime session",
          "Shared cloud projects and conversations",
          "Organization-owned provider credentials",
          "Email support",
        ],
      },
      {
        name: "Pro",
        audience: "For active teams shipping every day",
        monthlyPrice: "$49",
        annualPrice: "$41",
        blurb: "The default choice for teams that need room for collaboration, handoffs, and long-running work.",
        highlight: "Best value",
        cta: "Choose Pro",
        bullets: [
          "3 parallel cloud runtime sessions",
          "Faster handoffs across shared threads",
          "Best for 2 to 6 active collaborators",
          "Priority email support",
        ],
      },
      {
        name: "Max",
        audience: "For larger teams and heavy runtime usage",
        monthlyPrice: "$149",
        annualPrice: "$124",
        blurb: "High-capacity cloud execution for organizations running multiple workflows and teams in parallel.",
        cta: "Talk to us about Max",
        bullets: [
          "10 parallel cloud runtime sessions",
          "Room for multiple long-running jobs at once",
          "Best for operations, support, and engineering together",
          "Priority support with onboarding help",
        ],
      },
    ],
    includedTitle: "Included in every plan",
    includedItems: [
      "Shared organizations and projects",
      "Persistent cloud conversations",
      "Organization-managed providers",
      "Desktop and browser access",
    ],
    comparisonTitle: "What changes between plans",
    comparisonRows: [
      {
        label: "Parallel cloud sessions",
        values: ["1", "3", "10"],
      },
      {
        label: "Ideal team size",
        values: ["1 to 2 people", "2 to 6 people", "6+ people"],
      },
      {
        label: "Support",
        values: ["Email", "Priority email", "Priority + onboarding"],
      },
    ],
  },
  portal: {
    title: "Chatons for teams, with a runtime that stays online.",
    subtitle:
      "Sync your workspace, collaborate on projects and conversations, and run cloud threads that keep going after your desktop closes.",
    primaryCta: "Get started",
    primaryCtaConnected: "Continue setup",
    secondaryCta: "Log in",
    quickLinks: ["Settings sync", "Shared projects", "Organization providers"],
    panelTitle: "Organization-owned cloud control plane",
    panelBody:
      "Providers, shared projects and long-running conversations live in one place.",
    steps: [
      {
        title: "Create your Chatons account",
        body: "Connect desktop Chatons to your cloud workspace.",
      },
      {
        title: "Create your organization",
        body: "Set up the shared workspace for your team.",
      },
      {
        title: "Connect providers",
        body: "Keep provider access and secrets at the organization level.",
      },
    ],
    featuresHeader: "Why cloud",
    featuresTitle: "Designed for shared, durable work.",
    featuresBody:
      "Keep the desktop fast and polished while the workspace, runtime and provider access stay in the cloud.",
    features: [
      {
        title: "Synced workspace",
        body: "Projects, settings and cloud state stay consistent across devices.",
      },
      {
        title: "Shared conversations",
        body: "Collaborate on the same projects and threads with your team.",
      },
      {
        title: "Runs after you close the laptop",
        body: "Cloud conversations continue remotely until the work is done.",
      },
    ],
  },
  signup: {
    eyebrow: "Sign up",
    title: "Create your Chatons account",
    subtitle:
      "This is the account your desktop app will connect to after browser login.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    fullNamePlaceholder: "Ada Lovelace",
    emailPlaceholder: "ada@team.dev",
    passwordPlaceholder: "At least 8 characters",
    submit: "Continue to organization setup",
    pending: "Creating account...",
  },
  login: {
    eyebrow: "Log in",
    title: "Return to your cloud workspace",
    subtitle:
      "Sign back into your Chatons Cloud workspace and continue organization onboarding from the browser.",
    email: "Email",
    password: "Password",
    emailPlaceholder: "ada@team.dev",
    passwordPlaceholder: "Your password",
    submit: "Continue",
    pending: "Signing in...",
    forgotPassword: "Forgot your password?",
  },
  onboarding: {
    setupTitle: "Launch your cloud workspace",
    setupSubtitle: "Three steps to get your team up and running with Chatons Cloud.",
    summaryEyebrow: "Setup progress",
    summaryTitle: "Launch your workspace in three steps",
    summaryBody:
      "Set up the organization, connect at least one provider, then attach the desktop app to complete the workflow.",
    summaryItems: [
      "Choose the plan that fits your team's workflow",
      "Connect providers once for the entire organization",
      "Open the desktop app when everything is ready",
    ],
    statusReady: "Ready",
    statusPending: "Pending",
    organizationStatus: "Organization",
    providersStatus: "Providers",
    desktopStatus: "Desktop app",
    steps: {
      organization: {
        eyebrow: "Step 1",
        title: "Create your organization",
        subtitle: "Your team workspace lives here — projects, permissions, and billing.",
        activeOrganization: "Active organization",
        nameLabel: "Organization name",
        namePlaceholder: "Acme Labs",
        urlLabel: "Workspace URL",
        urlPlaceholder: "acme-labs",
        urlPreview: "Your workspace will be at",
        planLabel: "Choose your plan",
        save: "Save organization",
        saving: "Saving organization...",
      },
      provider: {
        eyebrow: "Step 2",
        title: "Connect an AI provider",
        subtitle: "Add your API credentials once — your whole team uses them.",
        providerLabel: "Provider",
        secretLabel: "API key or token",
        secretPlaceholder: "sk-live-...",
        add: "Add provider",
        adding: "Adding provider...",
        noProvider: "No providers configured yet.",
        secretPrefix: "Secret prefix:",
        connectedProviders: "Connected providers",
      },
      desktop: {
        eyebrow: "Step 3",
        title: "Connect the desktop app",
        subtitle: "Link Chatons Desktop to your cloud workspace.",
        infoTitle: "How to connect:",
        step1: "Open the button below in Chatons Desktop",
        step2: "Confirm the connection in the app",
        step3: "Your desktop is now linked to the cloud",
        openDesktop: "Open in Chatons Desktop",
        backToPortal: "Back to cloud portal",
        prereqOrganization: "Set up your organization first",
        prereqProvider: "Add at least one provider first",
      },
    },
    completion: {
      title: "Your workspace is ready!",
      body: "Open Chatons Desktop to start collaborating with your team.",
      cta: "Launch Chatons Desktop",
    },
    plans: [
      { label: "Plus", detail: "Great for a small shared workspace" },
      { label: "Pro", detail: "For active teams with multiple live sessions" },
      {
        label: "Max",
        detail: "For larger orgs and heavier runtime concurrency",
      },
    ],
  },
  forgotPassword: {
    eyebrow: "Password recovery",
    title: "Reset your password",
    subtitle:
      "Enter your email address and we will send you a reset link if the account exists.",
    email: "Email",
    emailPlaceholder: "ada@team.dev",
    submit: "Send reset link",
    pending: "Sending...",
    success: "If an account exists for this email, a reset link has been sent.",
    backToLogin: "Back to login",
  },
  resetPassword: {
    eyebrow: "Set a new password",
    title: "Choose a new password",
    subtitle: "This link is single-use and expires automatically.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    newPasswordPlaceholder: "At least 8 characters",
    confirmPasswordPlaceholder: "Repeat password",
    missingToken: "Missing reset token.",
    mismatch: "Passwords must match.",
    submit: "Reset password",
    pending: "Resetting...",
    success: "Your password has been reset. You can now sign in again.",
    backToLogin: "Back to login",
  },
  verifyEmail: {
    eyebrow: "Email verification",
    title: "Confirm your email",
    subtitle:
      "We use email verification to secure account recovery and desktop binding.",
    pending: "Verifying your email...",
    success: "Your email is now verified.",
    missingToken: "Missing verification token.",
    continueToLogin: "Continue to login",
  },
};

const cloudCopies: Partial<Record<LanguageCode, CloudCopy>> = {
  en,
  fr: {
    ...en,
    nav: { home: "Accueil", pricing: "Tarifs", signUp: "Créer un compte", logIn: "Se connecter" },
    portal: {
      ...en.portal,
      title: "Chatons pour les équipes, avec un runtime qui reste en ligne.",
      subtitle:
        "Retrouvez votre espace de travail, collaborez sur les projets et les conversations, et laissez les threads cloud continuer même quand votre desktop est fermé.",
      primaryCta: "Commencer",
      primaryCtaConnected: "Poursuivre la configuration",
      secondaryCta: "Se connecter",
      quickLinks: [
        "Réglages synchronisés",
        "Projets partagés",
        "Fournisseurs d'organisation",
      ],
      panelTitle: "Un control plane cloud piloté par l'organisation",
      panelBody:
        "Fournisseurs, projets partagés et conversations longues durées sont centralisés au même endroit.",
      steps: [
        {
          title: "Créer votre compte cloud",
          body: "Reliez Chatons Desktop à votre espace cloud.",
        },
        {
          title: "Créer votre organisation",
          body: "Mettez en place l'espace partagé de votre équipe.",
        },
        {
          title: "Ajouter les fournisseurs",
          body: "Gardez les accès et secrets IA au niveau de l'organisation.",
        },
      ],
      featuresHeader: "Pourquoi le cloud",
      featuresTitle: "Pensé pour un travail partagé et durable.",
      featuresBody:
        "Le desktop reste fluide pendant que l'espace de travail, le runtime et les accès fournisseurs vivent dans le cloud.",
      features: [
        {
          title: "Workspace synchronisé",
          body: "Projets, réglages et état cloud restent cohérents d'un appareil à l'autre.",
        },
        {
          title: "Conversations partagées",
          body: "Travaillez à plusieurs dans les mêmes projets et fils de discussion.",
        },
        {
          title: "Continue après fermeture",
          body: "Les conversations cloud poursuivent leur exécution à distance jusqu'au résultat.",
        },
      ],
    },
    signup: {
      ...en.signup,
      eyebrow: "Créer un compte",
      title: "Créer votre compte cloud",
      subtitle:
        "C'est ce compte que l'application desktop reliera après la connexion dans le navigateur.",
      fullName: "Nom complet",
      password: "Mot de passe",
      passwordPlaceholder: "8 caractères minimum",
      submit: "Passer à la configuration de l'organisation",
      pending: "Création du compte...",
    },
    login: {
      ...en.login,
      eyebrow: "Connexion",
      title: "Retour à votre espace cloud",
      subtitle:
        "Reconnectez-vous à votre espace Chatons Cloud et reprenez la configuration de l'organisation dans le navigateur.",
      password: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      submit: "Continuer",
      pending: "Connexion...",
      forgotPassword: "Mot de passe oublié ?",
    },
    onboarding: {
      ...en.onboarding,
      setupTitle: "Lancez votre espace cloud",
      setupSubtitle: "Trois étapes pour démarrer avec Chatons Cloud.",
      steps: {
        organization: {
          ...en.onboarding.steps.organization,
          eyebrow: "Étape 1",
          title: "Créez votre organisation",
          subtitle: "L'espace de travail de votre équipe — projets, permissions et facturation.",
          activeOrganization: "Organisation active",
          nameLabel: "Nom de l'organisation",
          namePlaceholder: "Acme Labs",
          urlLabel: "URL de l'espace",
          urlPlaceholder: "acme-labs",
          urlPreview: "Votre espace sera à",
          planLabel: "Choisissez votre plan",
          save: "Enregistrer l'organisation",
          saving: "Enregistrement...",
        },
        provider: {
          ...en.onboarding.steps.provider,
          eyebrow: "Étape 2",
          title: "Connectez un fournisseur IA",
          subtitle: "Ajoutez vos identifiants une fois — toute votre équipe les utilise.",
          providerLabel: "Fournisseur",
          secretLabel: "Clé API ou jeton",
          secretPlaceholder: "sk-live-...",
          add: "Ajouter le fournisseur",
          adding: "Ajout en cours...",
          noProvider: "Aucun fournisseur configuré pour le moment.",
          secretPrefix: "Préfixe du secret :",
          connectedProviders: "Fournisseurs connectés",
        },
        desktop: {
          ...en.onboarding.steps.desktop,
          eyebrow: "Étape 3",
          title: "Connectez l'application desktop",
          subtitle: "Liez Chatons Desktop à votre espace cloud.",
          infoTitle: "Comment connecter :",
          step1: "Ouvrez le bouton ci-dessous dans Chatons Desktop",
          step2: "Confirmez la connexion dans l'application",
          step3: "Votre desktop est maintenant lié au cloud",
          openDesktop: "Ouvrir dans Chatons Desktop",
          backToPortal: "Retour au portail cloud",
          prereqOrganization: "Configurez d'abord votre organisation",
          prereqProvider: "Ajoutez d'abord au moins un fournisseur",
        },
      },
      completion: {
        title: "Votre espace est prêt !",
        body: "Ouvrez Chatons Desktop pour commencer à collaborer avec votre équipe.",
        cta: "Lancer Chatons Desktop",
      },
    },
    forgotPassword: {
      ...en.forgotPassword,
      eyebrow: "Récupération du mot de passe",
      title: "Réinitialiser votre mot de passe",
      subtitle:
        "Saisissez votre adresse e-mail et nous vous enverrons un lien si le compte existe.",
      submit: "Envoyer le lien",
      pending: "Envoi...",
      success:
        "Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.",
      backToLogin: "Retour à la connexion",
    },
    resetPassword: {
      ...en.resetPassword,
      eyebrow: "Nouveau mot de passe",
      title: "Choisissez un nouveau mot de passe",
      subtitle:
        "Ce lien ne peut être utilisé qu'une fois et expire automatiquement.",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      newPasswordPlaceholder: "8 caractères minimum",
      confirmPasswordPlaceholder: "Répéter le mot de passe",
      missingToken: "Jeton de réinitialisation manquant.",
      mismatch: "Les mots de passe doivent être identiques.",
      submit: "Réinitialiser le mot de passe",
      pending: "Réinitialisation...",
      success:
        "Votre mot de passe a bien été réinitialisé. Vous pouvez vous reconnecter.",
      backToLogin: "Retour à la connexion",
    },
    verifyEmail: {
      ...en.verifyEmail,
      eyebrow: "Vérification de l'e-mail",
      title: "Confirmez votre adresse e-mail",
      subtitle:
        "La vérification e-mail sécurise la récupération du compte et l'association avec le desktop.",
      pending: "Vérification de votre adresse...",
      success: "Votre adresse e-mail est maintenant vérifiée.",
      missingToken: "Jeton de vérification manquant.",
      continueToLogin: "Continuer vers la connexion",
    },
  },
  es: {
    ...en,
    nav: { home: "Inicio", pricing: "Precios", signUp: "Crear cuenta", logIn: "Iniciar sesión" },
    portal: {
      ...en.portal,
      title: "Chatons para equipos, con un runtime que sigue en marcha.",
      subtitle:
        "Sincroniza tu espacio de trabajo, colabora en proyectos y conversaciones, y deja que los hilos cloud sigan funcionando aunque cierres la app.",
      primaryCta: "Empezar",
      primaryCtaConnected: "Seguir con la configuración",
      secondaryCta: "Iniciar sesión",
      quickLinks: [
        "Ajustes sincronizados",
        "Proyectos compartidos",
        "Proveedores de la organización",
      ],
      panelTitle: "Plano de control cloud gestionado por la organización",
      panelBody:
        "Los proveedores, los proyectos compartidos y las conversaciones largas viven en un único sitio.",
      steps: [
        {
          title: "Crea tu cuenta cloud",
          body: "Conecta Chatons Desktop con tu espacio de trabajo cloud.",
        },
        {
          title: "Crea tu organización",
          body: "Prepara el espacio compartido para tu equipo.",
        },
        {
          title: "Conecta proveedores",
          body: "Mantén los accesos y secretos al nivel de la organización.",
        },
      ],
      featuresHeader: "Por qué cloud",
      featuresTitle: "Pensado para trabajo compartido y duradero.",
      featuresBody:
        "El escritorio sigue siendo ágil mientras el workspace, el runtime y el acceso a proveedores viven en la nube.",
      features: [
        {
          title: "Workspace sincronizado",
          body: "Proyectos, ajustes y estado cloud se mantienen consistentes entre dispositivos.",
        },
        {
          title: "Conversaciones compartidas",
          body: "Colaborad en los mismos proyectos e hilos con todo el equipo.",
        },
        {
          title: "Sigue aunque cierres el portátil",
          body: "Las conversaciones cloud continúan en remoto hasta terminar el trabajo.",
        },
      ],
    },
    signup: {
      ...en.signup,
      eyebrow: "Crear cuenta",
      title: "Crea tu cuenta cloud",
      subtitle:
        "Esta es la cuenta que enlazará tu app de escritorio después de iniciar sesión en el navegador.",
      fullName: "Nombre completo",
      password: "Contraseña",
      passwordPlaceholder: "Al menos 8 caracteres",
      submit: "Seguir con la configuración de la organización",
      pending: "Creando cuenta...",
    },
    login: {
      ...en.login,
      eyebrow: "Iniciar sesión",
      title: "Vuelve a tu espacio cloud",
      subtitle:
        "Entra de nuevo en tu workspace de Chatons Cloud y continúa la configuración de la organización desde el navegador.",
      password: "Contraseña",
      passwordPlaceholder: "Tu contraseña",
      submit: "Continuar",
      pending: "Entrando...",
      forgotPassword: "¿Has olvidado tu contraseña?",
    },
    onboarding: {
      ...en.onboarding,
      setupTitle: "Lanza tu espacio cloud",
      setupSubtitle: "Tres pasos para comenzar con Chatons Cloud.",
      steps: {
        organization: {
          ...en.onboarding.steps.organization,
          eyebrow: "Paso 1",
          title: "Crea tu organización",
          subtitle: "El espacio de trabajo de tu equipo — proyectos, permisos y facturación.",
          activeOrganization: "Organización activa",
          nameLabel: "Nombre de la organización",
          namePlaceholder: "Acme Labs",
          urlLabel: "URL del espacio",
          urlPlaceholder: "acme-labs",
          urlPreview: "Tu espacio estará en",
          planLabel: "Elige tu plan",
          save: "Guardar organización",
          saving: "Guardando...",
        },
        provider: {
          ...en.onboarding.steps.provider,
          eyebrow: "Paso 2",
          title: "Conecta un proveedor IA",
          subtitle: "Añade tus credenciales una vez — todo tu equipo las usa.",
          providerLabel: "Proveedor",
          secretLabel: "Clave API o token",
          secretPlaceholder: "sk-live-...",
          add: "Añadir proveedor",
          adding: "Añadiendo...",
          noProvider: "Todavía no hay ningún proveedor configurado.",
          secretPrefix: "Prefijo del secreto:",
          connectedProviders: "Proveedores conectados",
        },
        desktop: {
          ...en.onboarding.steps.desktop,
          eyebrow: "Paso 3",
          title: "Conecta la app de escritorio",
          subtitle: "Enlaza Chatons Desktop con tu espacio cloud.",
          infoTitle: "Cómo conectar:",
          step1: "Abre el botón de abajo en Chatons Desktop",
          step2: "Confirma la conexión en la aplicación",
          step3: "Tu desktop ya está enlazado al cloud",
          openDesktop: "Abrir en Chatons Desktop",
          backToPortal: "Volver al portal cloud",
          prereqOrganization: "Primero configura tu organización",
          prereqProvider: "Primero añade al menos un proveedor",
        },
      },
      completion: {
        title: "¡Tu espacio está listo!",
        body: "Abre Chatons Desktop para empezar a colaborar con tu equipo.",
        cta: "Abrir Chatons Desktop",
      },
    },
    forgotPassword: {
      ...en.forgotPassword,
      eyebrow: "Recuperación de contraseña",
      title: "Restablece tu contraseña",
      subtitle:
        "Escribe tu correo y te enviaremos un enlace si la cuenta existe.",
      submit: "Enviar enlace de restablecimiento",
      pending: "Enviando...",
      success:
        "Si existe una cuenta para este correo, hemos enviado un enlace de restablecimiento.",
      backToLogin: "Volver al acceso",
    },
    resetPassword: {
      ...en.resetPassword,
      eyebrow: "Nueva contraseña",
      title: "Elige una nueva contraseña",
      subtitle:
        "Este enlace solo se puede usar una vez y caduca automáticamente.",
      newPassword: "Nueva contraseña",
      confirmPassword: "Confirmar contraseña",
      newPasswordPlaceholder: "Al menos 8 caracteres",
      confirmPasswordPlaceholder: "Repite la contraseña",
      missingToken: "Falta el token de restablecimiento.",
      mismatch: "Las contraseñas deben coincidir.",
      submit: "Restablecer contraseña",
      pending: "Restableciendo...",
      success:
        "Tu contraseña se ha restablecido. Ya puedes iniciar sesión otra vez.",
      backToLogin: "Volver al acceso",
    },
    verifyEmail: {
      ...en.verifyEmail,
      eyebrow: "Verificación de correo",
      title: "Confirma tu correo electrónico",
      subtitle:
        "La verificación por correo protege la recuperación de la cuenta y el enlace con la app de escritorio.",
      pending: "Verificando tu correo...",
      success: "Tu correo ya está verificado.",
      missingToken: "Falta el token de verificación.",
      continueToLogin: "Ir al acceso",
    },
  },
  de: {
    ...en,
    nav: { home: "Start", pricing: "Preise", signUp: "Registrieren", logIn: "Anmelden" },
    portal: {
      ...en.portal,
      title: "Chatons für Teams, mit einer Runtime, die online bleibt.",
      subtitle:
        "Synchronisiert euren Workspace, arbeitet gemeinsam an Projekten und Gesprächen und lasst Cloud-Threads weiterlaufen, auch wenn der Desktop schon zu ist.",
      primaryCta: "Loslegen",
      primaryCtaConnected: "Setup fortsetzen",
      secondaryCta: "Anmelden",
      quickLinks: [
        "Synchronisierte Einstellungen",
        "Geteilte Projekte",
        "Anbieter der Organisation",
      ],
      panelTitle: "Cloud-Control-Plane auf Organisationsebene",
      panelBody:
        "Anbieter, geteilte Projekte und lang laufende Konversationen liegen zentral an einem Ort.",
      steps: [
        {
          title: "Cloud-Konto anlegen",
          body: "Verbindet Chatons Desktop mit eurem Cloud-Workspace.",
        },
        {
          title: "Organisation erstellen",
          body: "Richtet den gemeinsamen Workspace für euer Team ein.",
        },
        {
          title: "Anbieter verbinden",
          body: "Verwaltet Zugänge und Secrets auf Organisationsebene.",
        },
      ],
      featuresHeader: "Warum Cloud",
      featuresTitle: "Für gemeinsame, dauerhafte Arbeit gebaut.",
      featuresBody:
        "Der Desktop bleibt schlank, während Workspace, Runtime und Provider-Zugänge in der Cloud liegen.",
      features: [
        {
          title: "Synchronisierter Workspace",
          body: "Projekte, Einstellungen und Cloud-Status bleiben auf allen Geräten konsistent.",
        },
        {
          title: "Geteilte Konversationen",
          body: "Arbeitet gemeinsam in denselben Projekten und Threads.",
        },
        {
          title: "Läuft weiter, wenn der Laptop zu ist",
          body: "Cloud-Konversationen arbeiten remote weiter, bis das Ergebnis da ist.",
        },
      ],
    },
    signup: {
      ...en.signup,
      eyebrow: "Registrieren",
      title: "Cloud-Konto erstellen",
      subtitle:
        "Mit diesem Konto verbindet sich eure Desktop-App nach dem Browser-Login.",
      fullName: "Vollständiger Name",
      password: "Passwort",
      passwordPlaceholder: "Mindestens 8 Zeichen",
      submit: "Weiter zur Organisations-Einrichtung",
      pending: "Konto wird erstellt...",
    },
    login: {
      ...en.login,
      eyebrow: "Anmelden",
      title: "Zurück zu eurem Cloud-Workspace",
      subtitle:
        "Meldet euch wieder bei Chatons Cloud an und setzt das Organisations-Setup im Browser fort.",
      password: "Passwort",
      passwordPlaceholder: "Euer Passwort",
      submit: "Weiter",
      pending: "Anmeldung läuft...",
      forgotPassword: "Passwort vergessen?",
    },
    onboarding: {
      ...en.onboarding,
      setupTitle: "Startet euren Cloud-Workspace",
      setupSubtitle: "Drei Schritte, um mit Chatons Cloud zu starten.",
      steps: {
        organization: {
          ...en.onboarding.steps.organization,
          eyebrow: "Schritt 1",
          title: "Erstellt eure Organisation",
          subtitle: "Der Arbeitsbereich eures Teams — Projekte, Rechte und Abrechnung.",
          activeOrganization: "Aktive Organisation",
          nameLabel: "Name der Organisation",
          namePlaceholder: "Acme Labs",
          urlLabel: "Workspace-URL",
          urlPlaceholder: "acme-labs",
          urlPreview: "Euer Workspace wird unter",
          planLabel: "Wählt euren Plan",
          save: "Organisation speichern",
          saving: "Wird gespeichert...",
        },
        provider: {
          ...en.onboarding.steps.provider,
          eyebrow: "Schritt 2",
          title: "KI-Anbieter verbinden",
          subtitle: "Fügt eure Zugangsdaten einmal hinzu — euer ganzes Team nutzt sie.",
          providerLabel: "Anbieter",
          secretLabel: "API-Schlüssel oder Token",
          secretPlaceholder: "sk-live-...",
          add: "Anbieter hinzufügen",
          adding: "Wird hinzugefügt...",
          noProvider: "Noch kein Anbieter eingerichtet.",
          secretPrefix: "Secret-Präfix:",
          connectedProviders: "Verbundene Anbieter",
        },
        desktop: {
          ...en.onboarding.steps.desktop,
          eyebrow: "Schritt 3",
          title: "Desktop-App verbinden",
          subtitle: "Verbindet Chatons Desktop mit eurem Cloud-Workspace.",
          infoTitle: "So verbindet ihr:",
          step1: "Öffnet den Button unten in Chatons Desktop",
          step2: "Bestätigt die Verbindung in der App",
          step3: "Euer Desktop ist jetzt mit der Cloud verbunden",
          openDesktop: "In Chatons Desktop öffnen",
          backToPortal: "Zurück zum Cloud-Portal",
          prereqOrganization: "Richtet zuerst eure Organisation ein",
          prereqProvider: "Fügt zuerst mindestens einen Anbieter hinzu",
        },
      },
      completion: {
        title: "Euer Workspace ist bereit!",
        body: "Öffnet Chatons Desktop, um mit eurem Team zu kollaborieren.",
        cta: "Chatons Desktop öffnen",
      },
    },
    forgotPassword: {
      ...en.forgotPassword,
      eyebrow: "Passwort zurücksetzen",
      title: "Passwort zurücksetzen",
      subtitle:
        "Gebt eure E-Mail-Adresse ein. Falls ein Konto existiert, senden wir euch einen Link.",
      submit: "Link senden",
      pending: "Wird gesendet...",
      success:
        "Falls es für diese E-Mail ein Konto gibt, wurde ein Reset-Link verschickt.",
      backToLogin: "Zurück zur Anmeldung",
    },
    resetPassword: {
      ...en.resetPassword,
      eyebrow: "Neues Passwort",
      title: "Neues Passwort festlegen",
      subtitle: "Dieser Link ist nur einmal gültig und läuft automatisch ab.",
      newPassword: "Neues Passwort",
      confirmPassword: "Passwort bestätigen",
      newPasswordPlaceholder: "Mindestens 8 Zeichen",
      confirmPasswordPlaceholder: "Passwort wiederholen",
      missingToken: "Reset-Token fehlt.",
      mismatch: "Die Passwörter müssen übereinstimmen.",
      submit: "Passwort zurücksetzen",
      pending: "Wird zurückgesetzt...",
      success:
        "Euer Passwort wurde zurückgesetzt. Ihr könnt euch jetzt wieder anmelden.",
      backToLogin: "Zurück zur Anmeldung",
    },
    verifyEmail: {
      ...en.verifyEmail,
      eyebrow: "E-Mail-Bestätigung",
      title: "E-Mail-Adresse bestätigen",
      subtitle:
        "Die E-Mail-Bestätigung schützt Kontowiederherstellung und Desktop-Verknüpfung.",
      pending: "E-Mail wird bestätigt...",
      success: "Eure E-Mail-Adresse ist jetzt bestätigt.",
      missingToken: "Bestätigungs-Token fehlt.",
      continueToLogin: "Weiter zur Anmeldung",
    },
  },
};

export function getCloudCopy(languageCode: LanguageCode): CloudCopy {
  return cloudCopies[languageCode] ?? en;
}
